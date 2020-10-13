module.exports = ({
  from="now-1d",
  to="now",  
}={})=>({
  props: {
    index: 'commits',
    type: 'doc',
    query: `dateUploaded:[${from} TO ${to}]`,
   // query: ` dateUploaded:[${from} TO ${to}]  AND tags:*`,
    source: [ "repo", "date","sha","parents","author.email","message","tags", "stat","dateUploaded" ],
  },
  query: `    
    MERGE (x:Commit2 {sha: hit._source.sha}) 
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