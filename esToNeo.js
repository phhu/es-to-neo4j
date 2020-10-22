/*
Basic express (micro)server to receive requests to e.g. 
http://localhost:3000/update/commits?days=365 
then send request to Neo4j to update records 
from ES to Neo4j, using APOC commands.

See http://neo4j-contrib.github.io/neo4j-apoc-procedures/3.5/database-integration/elasticsearch/ 
for the method used. (apoc.periodic.iterate can be called afterwards to handle deletions etc,
which otherwise cause performance problems).
*/
const sequential = require('promise-sequential');
const config = require('./config/config');
//const {getFromEsCypher,update} = require('./cypher');

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
    spec.queries = spec.queries || [];
 
    console.log(
      "Connected:",
      //spec.props.query,
      //c,
    );    

    const promises = spec.queries.map((q,i)=>()=>{
      console.log("query",i,q.cypher);
      const ret = session.run(q.cypher,{
        ...q.params,
        props: {
          ...config.props,
          ...spec.props,
          ...(q.params && q.params.props),
        },
      });
      //console.log("result",ret);
      return ret;
    });
    return await sequential(promises);

    //return results;
    /*
    const c = getFromEsCypher(spec);
    console.log(
      "Connected:",
      spec.props.query,
      //c,
      );
    const result = await session.run(c,spec);    //spec   {props:spec.props}
    console.log("Got result:",spec.props.query);
    //ret.spec = spec;
    ret.create = result ;//.records;
    
    //only iterate if specified
    if(spec.match && spec.update){
      ops.push('update');
      const updateResult = await session.run(update(spec),spec);      //{match:spec.match,update:spec.update}
      ret.update = updateResult.records;
    }
    console.log("ops", ret,
      ops.map(x=>ret[x].records && ret[x].records.length)
    );*/
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
    //console.log("return:",ret);
    res.send(JSON.stringify(
      ret,
      /*Object.entries(ret).reduce(
        (acc, [name,value] ) => {
          acc[name] = value.records.length;
          return acc;
        },
        {}
      ),*/
      null,2
    ));
  } catch(e){
    console.error("GET /:type - error",e);
    res.send(JSON.stringify({error: e},null,2));
  }
});

const server = app.listen(port, function() {
   console.log('Server started on port: ' + port);
});
server.setTimeout(20* 60*1000);
//const singleRecord = result.records[0]
//const node = singleRecord.get(0)
  
//console.log(node.properties)
//node.properties;

//JSON.stringify(result.records,null,2)
// result.records[0].get(0) 
//ret.create[0]._fields[0].map(x=>x.properties.summary),null,2