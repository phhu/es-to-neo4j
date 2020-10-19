MATCH 
	p=(r1:Release {name: 'WFO15.2FP0_0718'})
    <-[:TAG_IN_RELEASE]-(t1:Tag)
    <-[:TAGGED_WITH]-(c1:Commit)
			-[:COMMIT_HAS_PARENT*1..50]
    ->(c2:Commit)-[:TAGGED_WITH]
    ->(t2:Tag)-[:TAG_IN_RELEASE]
		->(r2:Release {name: 'WFO15.2FP0_0716'})
return p

match
  (r:Release)
optional match
  (r)<-[:TAG_IN_RELEASE]-(t:Tag)
optional match
  (t)<-[:TAGGED_WITH]-(c:Commit)
return r.name,t.name, t.repo,c.date
order by t.repo, r.name desc




// For commits between two releases:
// this should be done between tags or releases
// though releases work across repos
MATCH 
	p=(r1:Release {name: 'WFO15.2FP0_0716'})
    <-[:TAG_IN_RELEASE]-(t1:Tag {repo:'SC_WFM'})
    <-[:TAGGED_WITH]-(c1:Commit)
			-[:COMMIT_HAS_PARENT*1..300]
    ->(c2:Commit)-[:TAGGED_WITH]
    ->(t2:Tag)-[:TAG_IN_RELEASE]
		->(r2:Release {name: 'WFO15.2FP0_0712'})
WITH nodes(p) AS x UNWIND x AS c
match (c:Commit)
optional match (c)-[:TAGGED_WITH]->(t:Tag)-[:TAG_IN_RELEASE]->(r:Release)
optional match (t)<-[:KB_FOR_TAG]-(k:KB)
return distinct c.date, c.author, c.message, c.repo, c.tags, r.name, k.number




MATCH 
	p=(r1:Release {name: 'WFO15.2FP0_0718'})
    <-[:TAG_IN_RELEASE]-(t1:Tag {repo:'SC_WFM_UI'})
    <-[:TAGGED_WITH]-(c1:Commit)
			-[:COMMIT_HAS_PARENT*1..300]
    ->(c2:Commit)-[:TAGGED_WITH]
    ->(t2:Tag)-[:TAG_IN_RELEASE]
		->(r2:Release {name: 'WFO15.2FP0_0712'})
WITH nodes(p) AS x UNWIND x AS c
match (c:Commit)
optional match (c)-[:TAGGED_WITH]->(t:Tag)-[:TAG_IN_RELEASE]->(r:Release)
optional match (t)<-[:KB_FOR_TAG]-(k:KB)
return distinct c.date, left(c.sha,7),c.author, c.message, c.repo, c.tags, r.name, k.number


MATCH 
	p=(r1:Release {name: 'WFO15.2FP0_0718'})
    <-[:TAG_IN_RELEASE]-(t1:Tag {repo:'SC_WFM_UI'})
    <-[:TAGGED_WITH]-(c1:Commit)
			-[:COMMIT_HAS_PARENT*1..100]
    ->(c2:Commit)-[:TAGGED_WITH]
    ->(t2:Tag)-[:TAG_IN_RELEASE]
		->(r2:Release {name: 'WFO15.2FP0_0716'})
WITH nodes(p) AS x UNWIND x AS c
match (c:Commit)
optional match (c)-[:TAGGED_WITH]->(t:Tag)-[:TAG_IN_RELEASE]->(r:Release)
optional match (t)<-[:KB_FOR_TAG]-(k:KB)
return distinct c.date, ,c.sha,left(c.sha,7),c.author, c.message, c.repo, c.tags, r.name, k.number

// get releases and commits after a starting release, across all repos
match (r:Release) 
//MATCH (c:Commit {sha:"02908ac233fed9e28f49444807718a1bf7f1ea70"})
match (r1:Release {name:"WFO15.2FP0_0712"})
CALL apoc.path.expandConfig(r1, {
	relationshipFilter: "<COMMIT_HAS_PARENT|TAGGED_WITH|TAG_IN_RELEASE",
    labelFilter: "Commit|Tag|Release",
    terminatorNodes: r,
    minLevel: 1,
    maxLevel: 30
})
YIELD path
RETURN path;


// update releases as commitreleases
match (c:Commit)-[:TAGGED_WITH]->(t:Tag)-[:TAG_IN_RELEASE]->(r:Release) set c:ReleaseCommit set c.ReleaseName = r.name return c

//
match (rc:ReleaseCommit) 
MATCH (c:Commit {sha:"02908ac233fed9e28f49444807718a1bf7f1ea70"})
//match (r1:Release {name:"WFO15.2FP0_0712"})
CALL apoc.path.expandConfig(c, {
	relationshipFilter: "<COMMIT_HAS_PARENT|TAGGED_WITH|TAG_IN_RELEASE",
    labelFilter: "Commit|Tag|Release",
    terminatorNodes: rc,
    minLevel: 1,
    maxLevel: 30
})
YIELD path
RETURN path;

// 
match (rc:ReleaseCommit) 
MATCH (rc1:ReleaseCommit {sha:"e45acef0d7aa50382997175560a03bda1c9741ae"})
//match (r1:Release {name:"WFO15.2FP0_0712"})
CALL apoc.path.expandConfig(rc1, {
	relationshipFilter: "<COMMIT_HAS_PARENT",   // |TAGGED_WITH|TAG_IN_RELEASE
    labelFilter: "Commit",   // |Tag|Release
    terminatorNodes: rc,
    minLevel: 1,
    maxLevel: 30
})
YIELD path
with path, last(nodes(path)) as lastNode, tail(nodes(path)) as tailNodes
FOREACH (n IN nodes(path) | REMOVE n.containedInRelease)
FOREACH (n IN tailNodes | SET n.containedInRelease = lastNode.ReleaseName  )
RETURN path;


// update releases as commitreleases
match (c:Commit)-[:TAGGED_WITH]->(t:Tag)-[:TAG_IN_RELEASE]->(r:Release) 
  set c:ReleaseCommit 
  set c.ReleaseName = r.name return c

// trace commits before a release commit and label them as contained in that release
match (rc:ReleaseCommit) 
//MATCH (rc1:ReleaseCommit {sha:"e45acef0d7aa50382997175560a03bda1c9741ae"})
//match (r1:Release {name:"WFO15.2FP0_0712"})
with collect(rc) as rcs
//foreach (rc1 in rcs |
  CALL apoc.path.expandConfig(rcs, {
      relationshipFilter: "<COMMIT_HAS_PARENT",   // |TAGGED_WITH|TAG_IN_RELEASE
      labelFilter: "Commit",   // |Tag|Release
      terminatorNodes: rcs,
      minLevel: 1,
      maxLevel: 300
  })
  YIELD path
  with path, last(nodes(path)) as lastNode, tail(nodes(path)) as tailNodes
  //FOREACH (n IN nodes(path) | REMOVE n.containedInRelease)
  FOREACH (n IN tailNodes| SET n.containedInRelease = lastNode.ReleaseName  )
  //RETURN path
//)
return lastNode


// get some dteails
MATCH 
	p=(r1:Release {name: 'WFO15.2FP0_0718'})
    <-[:TAG_IN_RELEASE]-(t1:Tag {repo:'SC_WFM_UI'})
    <-[:TAGGED_WITH]-(c1:Commit)
			-[:COMMIT_HAS_PARENT*1..300]
    ->(c2:Commit)-[:TAGGED_WITH]
    ->(t2:Tag)-[:TAG_IN_RELEASE]
		->(r2:Release {name: 'WFO15.2FP0_0712'})
WITH nodes(p) AS x UNWIND x AS c
match (c:Commit)
optional match (c)-[:TAGGED_WITH]->(t:Tag)-[:TAG_IN_RELEASE]->(r:Release)
optional match (t)<-[:KB_FOR_TAG]-(k:KB)
return distinct c.date, left(c.sha,7),c.author, c.message, c.repo, c.tags, r.name, k.number



// to remove wrong release links

MATCH (r:Release)<-[rtr:TAG_IN_RELEASE]-(t:Tag)<-[:TAGGED_WITH]-(c:Commit)
      WHERE 1=1
        // AND t.repo = 'SC_WFM'
        AND not t.name =~ '.*(rel|RC).*'
      remove c:ReleaseCommit
      delete rtr
      return r, t, c