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
return r,t
order by t.repo, r.name desc