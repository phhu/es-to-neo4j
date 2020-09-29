module.exports = ({
  days=1,  
}={})=>({
  props: {
    index: 'jira',
    type: '_doc',
    query: `BUG AND updated:[now-${days}d TO now]`,
    source: [ "key", "wfoTeamName","summary","assignee","gitHashes" ],
  },
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
  `,
});