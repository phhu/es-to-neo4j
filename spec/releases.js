const {
  getFromEsCypher,
  iterateUpdate,
} = require('../cypher');

module.exports = ({
  from="now-1y",
  to="now",  
  //repo="SC_WFM",
}={})=>({
  props: {
    index: 'artifactory',
    returnHits: true,
    type: 'doc',
    reposByComponent: {
      "WFM Common": "SC_WFM",
      "WFM UI": "SC_WFM_UI",
      "WFM API": "SC_WFM_API",
      "Performance Management": "SC_SCORECARDS",
      "Framework Database BPMAINDB": "SC_DB",
      "Framework Foundation": "SC_FOUNDATION",
      "Framework Integration Server": "SC_INTEG_COMMON",
      "Backoffice Operations": "SC_OPS",
      "Forecasting and Scheduling": "SC_ALGO",
      "Framework Reporting": "SC_REPORTING",
    },
    // component:"WFM Common" AND containedInRelease:*15.2*0516 AND
    //query: `containedInRelease:* AND repo:"T3-Passed-QA" AND NOT extension:jar AND date:[${from} TO ${to}]`,   //Uploaded    :"performance management"
    query: `containedInRelease:* AND repo:"T3-Passed-QA" AND NOT extension:jar AND date:[${from} TO ${to}]`,   //Uploaded    :"performance management"
    source: [ "repo", "date","product","component","version","kb","containedInRelease", "repo","lastUpdated" ],
  },
  queries: [
    {
      props: {
        // none
      },
      cypher: getFromEsCypher({
        query: `
          MATCH (t:Tag)<-[:TAGGED_WITH]-(c:Commit)
            WHERE
              t.repo = $props.reposByComponent[hit._source.component] 
              AND t.name =~ '.*(rel|RC).*' + hit._source.version
            MERGE (x:Release {name: hit._source.containedInRelease})
            //set x.test = 8
            //set t.test = 8
            MERGE (k:KB {number: hit._source.kb})
              set k.repo = hit._source.repo
              //set k.test = 8
            MERGE 
              (k)-[:KB_IN_RELEASE]->(x)
            MERGE
              (k)-[:KB_FOR_TAG]->(t)
            MERGE
              (t)-[:TAG_IN_RELEASE]->(x)
            SET c:ReleaseCommit
            SET c.containedInRelease = hit._source.containedInRelease
            SET c.releaseName = hit._source.containedInRelease
        `,
      })
    },{
      cypher: iterateUpdate({}),
      params: {     //  {sha:"e45acef0d7aa50382997175560a03bda1c9741ae"}
        match: `
          MATCH (rc:ReleaseCommit)
          RETURN rc 
        `,
        update: `
          CALL apoc.path.expandConfig(rc, {
            relationshipFilter: ">COMMIT_HAS_PARENT",  
            labelFilter: "/ReleaseCommit|Commit",
            bfs: false,
            uniqueness: "NODE_GLOBAL",
            maxLevel: 500
          })
          YIELD path
          FOREACH (n in tail(reverse(tail(nodes(path)))) | 
            SET n.containedInRelease=rc.releaseName
            set n.releaseShort = right(rc.releaseName,4)
          )
          set rc.releaseShort = right(rc.releaseName,4)
          //set rc.test = 10
          return rc
        `
      }
    },{    // and c.repo ='SC_ALGO'
      cypher: `
        WITH $props as props
        MATCH (c:Commit)
        WHERE c.containedInRelease is not null 
        CALL apoc.es.postRaw(
          props.host,
          'commits' + '/doc/'+c.sha+ '/_update',
          {doc:
            {inRelease: c.containedInRelease}
          }
        ) YIELD value as v
        RETURN 
          c.sha,
          c.repo,
          c.containedInRelease, 
          v
      `
    }
  ]
 
});

/*
SET c:ReleaseCommit
      SET c.releaseName = hit._source.containedInRelease
      SET c.containedInRelease = hit._source.containedInRelease
      <-[:TAGGED_WITH]-(c:Commit)
*/
/*
  // {sha:"e45acef0d7aa50382997175560a03bda1c9741ae"}
,  


    //FOREACH (n IN tailNodes| SET n.containedInRelease = lastNode.ReleaseName  )
    //WITH path, last(nodes(path)) as lastNode, tail(nodes(path)) as tailNodes
    //FOREACH (n IN nodes(path) | REMOVE n.containedInRelease)

MATCH (rc1:ReleaseCommit {sha:"e45acef0d7aa50382997175560a03bda1c9741ae"})
//match (r1:Release {name:"WFO15.2FP0_0712"})

//foreach (rc1 in rcs |
  CALL apoc.path.expandConfig(rc1, {
      relationshipFilter: ">COMMIT_HAS_PARENT",   // |TAGGED_WITH|TAG_IN_RELEASE
      labelFilter: "/ReleaseCommit|Commit",   // |Tag|Release
      minLevel: 1,
      maxLevel: 500
  })
  YIELD path
  return path


*/
        /*
          minLevel: 1,
          set n.releaseShort = right(rc.releaseName,4) 
                set n.test = 8
            set n.releaseShort = right(rc.releaseName,4)
        */
/*
AND component:"${components[repo] || "*"}"
'${repo}'

   SC_SCORECARDS
    MATCH (t:Tag)
    WHERE
      t.repo = 'SC_SCORECARDS'
      AND t.name =~ '.*' + hit._source.version

    MERGE
      (t)-[:TAG_IN_RELEASE]->(x)

*/