

const components = {
  "SC_WFM": "WFM Common",
  "SC_SCORECARDS": "performance management",
  "SC_DB": "Framework Database BPMAINDB",
  "SC_FOUNDATION": "Framework Foundation",
};

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
      "performance management": "SC_SCORECARDS",
      "Framework Database BPMAINDB": "SC_DB",
      "Framework Foundation": "SC_FOUNDATION",
      "Framework Integration Server": "SC_INTEG_COMMON",
      "Backoffice Operations": "SC_OPS",
      "Forecasting and Scheduling": "SC_ALGO",
      "Framework Reporting": "SC_REPORTING",
    },
    query: `containedInRelease:* AND repo:"T3-Passed-QA" AND NOT extension:jar AND date:[${from} TO ${to}]`,   //Uploaded    :"performance management"
    source: [ "repo", "date","product","component","version","kb","containedInRelease", "repo","lastUpdated" ],
  },
  query: `
    MATCH (t:Tag)
    WHERE
      t.repo = $props.reposByComponent[hit._source.component] 
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