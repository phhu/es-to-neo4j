/*
This is skeleton cypher for pulling data from Elastic search
and updating it into Neo4j.

*/
/*
{
    size: 100
    ,host: 'es.host.name:9200'
    ,index: 'someIndex
    ,type: '_doc'
    ,query: 'BUG AND updated:[now-1d TO now]'
    ,source: [ "key", "wfoTeamName","summary","assignee","gitHashes" ]
  }
*/

module.exports = {
  getFromEsCypher: ({
    query,
    returnHits=false,     // should items created be included in return value (slower)
  }={}) => `
  WITH $props as props
  CALL apoc.es.query(
    props.host,
    props.index,
    props.type,
    'scroll=5m',
    {
      size: props.size, 
      _source: props.source,
      query: {
        query_string:{
          query: props.query 
        }
      }
    }
  ) yield value
  WITH 
    value._scroll_id as scrollId, 
    value.hits.hits as hits,
    value.hits.total as totalHits, 
    props
  UNWIND hits as hit
     ${query}
  WITH 
    range(1,totalHits/props.size) as list, 
    scrollId, 
    props, 
    totalHits, 
    collect(x) as firstHits
  UNWIND 
    list as c
  CALL apoc.es.post(props.host,"_search","scroll",null,{scroll:"5m",scroll_id:scrollId}) 
      yield value
  WITH
      value._scroll_id as scrollId,
      value.hits.hits as nextHits,
      totalHits, 
      firstHits, 
      props
  UNWIND nextHits as hit 
    ${query}        
  RETURN 
    totalHits
    ,props
    ${returnHits ? ",firstHits+x as items" : ""} 
  `,
  iterateUpdate: ({}={}) => `
    CALL apoc.periodic.iterate(
      $match, 
      $update,
      {
        batchSize:10000, 
        parallel:true
      }
    )
  `,
};