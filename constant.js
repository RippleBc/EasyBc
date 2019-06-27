const path = require("path");

//
module.exports.SUCCESS = 0;
module.exports.PARAM_ERR = 1;
module.exports.OTH_ERR = 2;

//
module.exports.TRANSACTION_STATE_IN_CACHE = 1;
module.exports.TRANSACTION_STATE_PROCESSING = 2;
module.exports.TRANSACTION_STATE_PACKED = 3;

//
module.exports.BLOCK_CHAIN_DATA_DIR = path.join(__dirname, "./block_chain_data");

//
module.exports.QUERY_MAX_LIMIT = 500