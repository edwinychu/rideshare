const elasticsearch = require('elasticsearch');

const elasticClient = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'info',
});

/**
 * Delete an existing index
 */
function deleteIndex(tableName) {
  return elasticClient.indices.delete({
    index: tableName,
  });
}
exports.deleteIndex = deleteIndex;

/**
 * create the index
 */
function initIndex(tableName) {
  return elasticClient.indices.create({
    index: tableName,
  });
}
exports.initIndex = initIndex;

/**
 * check if the index exists
 */
function indexExists(tableName) {
  return elasticClient.indices.exists({
    index: tableName,
  });
}
exports.indexExists = indexExists;
