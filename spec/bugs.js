const {
  getFromEsCypher,
  iterateUpdate,
} = require('../cypher');

module.exports = ({
  from="now-1d",       // arguments should be escaped
  to="now", 
}={})=>({

  queries: [
    {
      params: {
        props: {
          index: 'jira',
          type: '_doc',
          query: `BUG AND updated:[${from} TO ${to}]`,
          source: [ "key", "wfoTeamName","summary","assignee","gitHashes" ],
        },
      },
      cypher: getFromEsCypher({
        query: `
          MERGE (x:Bug {id: hit._id}) 
          SET
            x.summary = hit._source.summary,
            x.wfoTeamName = hit._source.wfoTeamName,
            x.description = hit._source.description,
            x.assignee = hit._source.assignee
          MERGE 
            (u:User {email: coalesce(hit._source.assignee,'unknown')})
          MERGE 
            (x)-[:ASSIGNED_TO]-(u)
          FOREACH 
            (githash in hit._source.gitHashes |
              MERGE (c:Commit {sha: trim(githash)})
              MERGE (x)-[rcf:HAS_COMMIT]-(c)
            )
       `,
      })
    },{
      cypher: iterateUpdate({}),
      params: {     //  {sha:"e45acef0d7aa50382997175560a03bda1c9741ae"}
        match: `
          MATCH
            (b:Bug)-[r:ASSIGNED_TO]-(uOld:User)
          WHERE
            uOld.email <> b.assignee
          RETURN 
            b,r,uOld
        `,
        update: `
          DELETE r
          MERGE 
            (u:User {email: coalesce(b.assignee,'unknown')})
          MERGE
            (b)-[r2:ASSIGNED_TO]-(u)
          return r2
        `
      }
    }
  ],
});
