/*
Basic express (micro)server to receive requests to e.g. 
http://localhost:3000/update/commits?days=365 
then send request to Neo4j to update records 
from ES to Neo4j, using APOC commands.

See http://neo4j-contrib.github.io/neo4j-apoc-procedures/3.5/database-integration/elasticsearch/ 
for the method used. (apoc.periodic.iterate can be called afterwards to handle deletions etc,
which otherwise cause performance problems).
*/

const config = require('./config/config');
const {cypher,update} = require('./cypher');

const express = require('express');
const app = express();
const port = (config.express && config.express.port) || 3000;   // process.env.port

const neo4j = require('neo4j-driver');

const runQuery = async (specName, params) => {

  console.log("Specname:",specName, params);
  const ops =  ['create'];
  const ret = {};
  let driver, session;

  try {  
    
    // create anew each time in case of failure
    driver = neo4j.driver(
      config.neo4j.uri, 
      neo4j.auth.basic(
        config.neo4j.user, 
        config.neo4j.password
      )
    );
    session = driver.session();
    
    const spec = require(`./spec/${specName}`)(params);
    spec.props = {
      ...config.props,
      ...spec.props,
    };
    const result = await session.run(cypher(spec), spec);    //{props:spec.props}
    ret.create = result.records;
    
    //only iterate if specified
    if(spec.match && spec.update){
      ops.push('update');
      const updateResult = await session.run(update(spec),spec);      //{match:spec.match,update:spec.update}
      ret.update = updateResult.records;
    }
    console.log(
      ops.map(x=>ret[x].length)
    );
    return ret;

  } catch (e){
    console.error("runQuery error",e);
    return {"error":e};
  } finally {
    try {
      await session.close();
      await driver.close();
    }
    catch(e){
      console.error("Error closing neo4j session / driver",e);
    }
  }

};

app.get('/update/:type',async (req,res)=>{
  try {
    const ret = await runQuery(req.params.type, req.query);
    res.send(JSON.stringify(
      Object.entries(ret).reduce(
        (acc, [name,value] ) => {
          acc[name] = value.length;
          return acc;
        },
        {}
      ),
      null,2
    ));
  } catch(e){
    console.error("GET /:type - error",e);
    res.send(JSON.stringify({error: e},null,2));
  }
});

app.listen(port, function() {
   console.log('Server started on port: ' + port);
});

//const singleRecord = result.records[0]
//const node = singleRecord.get(0)
  
//console.log(node.properties)
//node.properties;

//JSON.stringify(result.records,null,2)
// result.records[0].get(0) 
//ret.create[0]._fields[0].map(x=>x.properties.summary),null,2