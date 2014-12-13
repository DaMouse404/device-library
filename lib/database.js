var ddb = require('dynamodb'),
    config = require('config');

module.exports=ddb.ddb(config.AWS);
