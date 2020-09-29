module.exports =  {
  neo4j: {
    uri: 'neo4j://host.name/',
    user: 'neo4j',
    password: 'test',
  },
  express: {
    port: 3000,
  },
  // props are defaults for the spec files. 
  // these values can be overriden in 
  props: {
    host: 'elasticsearch.host:9200',
    size: 100,
  }
};