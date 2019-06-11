module.exports.MAX_PROCESS_TRANSACTIONS_SIZE = 100;

// stage 
module.exports.STAGE_DATA_EXCHANGE_TIMEOUT = 2000;
module.exports.STAGE_STAGE_SYNCHRONIZE_TIMEOUT = 1000;

module.exports.STAGE_MAX_FINISH_RETRY_TIMES = 3;

module.exports.STAGE_STATE_EMPTY = 1;
module.exports.STAGE_STATE_DATA_EXCHANGE_PROCEEDING = 2;
module.exports.STAGE_STATE_DATA_EXCHANGE_FINISH_SUCCESS_AND_SYNCHRONIZE_PROCEEDING = 3;
module.exports.STAGE_STATE_DATA_EXCHANGE_FINISH_TIMEOUT_AND_SYNCHRONIZE_PROCEEDING = 4;

// ripple
module.exports.RIPPLE_STAGE_EMPTY = 0;
module.exports.RIPPLE_STAGE_AMALGAMATE = 1;
module.exports.RIPPLE_STAGE_CANDIDATE_AGREEMENT = 2;
module.exports.RIPPLE_STAGE_BLOCK_AGREEMENT = 3;
module.exports.RIPPLE_STAGE_BLOCK_AGREEMENT_PROCESS_BLOCK = 4;

module.exports.RIPPLE_STATE_STAGE_CONSENSUS = 1;
module.exports.RIPPLE_STATE_TRANSACTIONS_CONSENSUS = 2;
module.exports.RIPPLE_STATE_PERISH_NODE = 3;

// amalgamate
module.exports.PROTOCOL_CMD_CANDIDATE_AMALGAMATE = 100;
module.exports.PROTOCOL_CMD_CANDIDATE_AMALGAMATE_FINISH_STATE_REQUEST = 101;
module.exports.PROTOCOL_CMD_CANDIDATE_AMALGAMATE_FINISH_STATE_RESPONSE = 102;

// candidate agreement
module.exports.PROTOCOL_CMD_CANDIDATE_AGREEMENT = 200;
module.exports.PROTOCOL_CMD_CANDIDATE_AGREEMENT_FINISH_STATE_REQUEST = 201;
module.exports.PROTOCOL_CMD_CANDIDATE_AGREEMENT_FINISH_STATE_RESPONSE = 202;

// block agreement
module.exports.PROTOCOL_CMD_BLOCK_AGREEMENT = 300;
module.exports.PROTOCOL_CMD_BLOCK_AGREEMENT_FINISH_STATE_REQUEST = 301;
module.exports.PROTOCOL_CMD_BLOCK_AGREEMENT_FINISH_STATE_RESPONSE = 302;

module.exports.BLOCK_AGREEMENT_TIMESTAMP_MAX_OFFSET = 20 * 1000;

// counter
module.exports.PROTOCOL_CMD_INVALID_AMALGAMATE_STAGE = 400;
module.exports.PROTOCOL_CMD_INVALID_CANDIDATE_AGREEMENT_STAGE = 401;
module.exports.PROTOCOL_CMD_INVALID_BLOCK_AGREEMENT_STAGE = 402;
module.exports.PROTOCOL_CMD_STAGE_INFO_REQUEST = 403;
module.exports.PROTOCOL_CMD_STAGE_INFO_RESPONSE = 404;
module.exports.PROTOCOL_CMD_COUNTER_FINISH_STATE_REQUEST = 405;
module.exports.PROTOCOL_CMD_COUNTER_FINISH_STATE_RESPONSE = 406;

module.exports.COUNTER_HANDLER_TIME_DETAY = 1000;
module.exports.COUNTER_INVALID_STAGE_TIME_SECTION = 6000;

module.exports.COUNTER_CONSENSUS_STAGE_TRIGGER_THRESHOULD = 3;
module.exports.COUNTER_CONSENSUS_STAGE_TRIGGER_MAX_SIZE = 50

// Perish
module.exports.PROTOCOL_CMD_KILL_NODE_REQUEST = 500;
module.exports.PROTOCOL_CMD_KILL_NODE_RESPONSE = 501;
module.exports.PROTOCOL_CMD_KILL_NODE_FINISH_STATE_REQUEST = 502;
module.exports.PROTOCOL_CMD_KILL_NODE_FINISH_STATE_RESPONSE = 503;

module.exports.ACTIVE_PERISH_DATA_PERIOD_OF_VALID = 5 * 1000;
module.exports.NEGATIVE_PERISH_DATA_PERIOD_OF_VALID = 15 * 1000;
//
module.exports.TRANSACTIONS_CONSENSUS_THRESHOULD = 0.8;