

const components = {
  "SC_WFM": "WFM Common",
  "SC_SCORECARDS": "performance management",
  "SC_DB": "Framework Database BPMAINDB",
  "SC_FOUNDATION": "Framework Foundation",
};

module.exports = ({
  from="now-1d",
  to="now",  
  repo="SC_WFM",
}={})=>({
  props: {
    index: 'artifactory',
    returnHits: true,
    type: 'doc',
    query: `containedInRelease:* AND component:"${components[repo] || "*"}" AND repo:"T3-Passed-QA" AND NOT extension:jar `,   //Uploaded    :"performance management"
    source: [ "repo", "date","product","component","version","kb","containedInRelease", "repo","lastUpdated" ],
  },
  query: `
    MATCH (t:Tag)
    WHERE
      t.repo = '${repo}'
      AND t.name =~ '.*' + hit._source.version
    MERGE (x:Release {name: hit._source.containedInRelease})
    MERGE (k:KB {number: hit._source.kb})
    MERGE 
      (k)-[:KB_IN_RELEASE]->(x)
    MERGE
      (t)-[:TAG_IN_RELEASE]->(x)

  `,

});

/*
   SC_SCORECARDS
    MATCH (t:Tag)
    WHERE
      t.repo = 'SC_SCORECARDS'
      AND t.name =~ '.*' + hit._source.version

    MERGE
      (t)-[:TAG_IN_RELEASE]->(x)

*/