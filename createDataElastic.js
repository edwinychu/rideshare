const elastic = require('./elasticSearch.js');

// create unmatched and matched tables
async function createTables() {
  if (!elastic.indexExists('unmatched')) {
    await elastic.initIndex('unmatched');
    if (!elastic.indexExists('matched')) {
      await elastic.initIndex('matched');
    }
  }
}




createTables().then(() => {});
