Create a config file at config/config.js (copy and modify the sample provided.

```
npm install
node esToNeo.js
```

Then http://localhost:3000/update/commits?from=now-7d&to=now etc

curl "http://localhost:3000/update/commits?from=now-7d&to=now"


curl "http://localhost:3000/update/releases"
 

For APOC, see https://neo4j.com/labs/apoc/4.1/


ES back update:
https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-update.html

http://neo4j-contrib.github.io/neo4j-apoc-procedures/3.5/database-integration/elasticsearch/

Note that URL format for update has changed! this is for v6.2 ES:

match (c:Commit) where c.containedInRelease is not null and c.repo ='SC_ALGO'
CALL apoc.es.postRaw('tier3.glalab.local:9200','commits/doc/'+c.sha+ '/_update' ,{doc:{inRelease: c.containedInRelease}}) YIELD value as v
return c.sha,c.repo,c.containedInRelease, v