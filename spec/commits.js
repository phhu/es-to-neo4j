module.exports = ({
  from="now-1d",
  to="now",  
}={})=>({
  props: {
    index: 'commits',
    type: 'doc',
    query: `date:[${from} TO ${to}] `,   //Uploaded   AND repo:SC_WFM
    source: [ "repo", "date","sha","parents","author.email","message","tags", "stat","dateUploaded" ],
  },
  query: `    
    MERGE (x:Commit {sha: hit._source.sha}) 
    SET
      x.date = hit._source.date
      ,x.repo = hit._source.repo
      ,x.message = hit._source.message
      ,x.author = hit._source.author.email
      ,x.dateUploaded = hit._source.dateUploaded
      ,x.tags = hit._source.tags
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
    FOREACH 
      (githash in hit._source.parents |
        MERGE (c:Commit {sha: trim(githash)})
        MERGE (x)-[rcf:COMMIT_HAS_PARENT]->(c)
      ) 
    FOREACH 
      (tag in hit._source.tags |
        MERGE (t:Tag {name: tag,repo:hit._source.repo})
        MERGE (x)-[rct:TAGGED_WITH]->(t)
      )    
  `,
  /*
   ,x.tags = hit._source.tags

  
  
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
  `,*/
});