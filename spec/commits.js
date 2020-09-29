module.exports = ({
  days=1,  
}={})=>({
  props: {
    index: 'commits',
    type: 'doc',
    query: `dateUploaded:[now-${days}d TO now]`,
    source: [ "repo", "date","sha","author.email","message","tags", "stat","dateUploaded" ],
  },
  query: `    
    MERGE (x:Commit {sha: hit._source.sha}) 
    SET
      x.date = hit._source.date
      ,x.repo = hit._source.repo
      ,x.message = hit._source.message
      ,x.author = hit._source.author.email
      ,x.dateUploaded = hit._source.dateUploaded
    MERGE 
      (u:User {
        email: coalesce(hit._source.author.email,'unknown')
      })
    MERGE 
      (x)-[:COMMITED_BY]->(u)
    MERGE
      (r:Repo {
        name: hit._source.repo
      })
    MERGE
      (x)-[:COMMIT_IN_REPO]->(r)
  `,
  /*match: `
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
  `,*/
});