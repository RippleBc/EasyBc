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
module.exports.RIPPLE_STAGE_PERISH = 5;
module.exports.RIPPLE_STAGE_PERISH_PROCESSING_CHEATED_NODES = 6;
module.exports.RIPPLE_STAGE_COUNTER = 7;
module.exports.RIPPLE_STAGE_COUNTER_FETCHING_NEW_TRANSACTIONS = 8;


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
module.exports.BLOCK_AGREEMENT_TIMESTAMP_JUMP_LENGTH = 10;

// counter
module.exports.PROTOCOL_CMD_INVALID_AMALGAMATE_STAGE = 400;
module.exports.PROTOCOL_CMD_INVALID_CANDIDATE_AGREEMENT_STAGE = 401;
module.exports.PROTOCOL_CMD_INVALID_BLOCK_AGREEMENT_STAGE = 402;
module.exports.PROTOCOL_CMD_COUNTER_INFO_REQUEST = 403;
module.exports.PROTOCOL_CMD_COUNTER_INFO_RESPONSE = 404;
module.exports.PROTOCOL_CMD_COUNTER_STAGE_SYNC_REQUEST = 405;
module.exports.PROTOCOL_CMD_COUNTER_STAGE_SYNC_RESPONSE = 406;
module.exports.PROTOCOL_CMD_COUNTER_FINISH_STATE_REQUEST = 407;
module.exports.PROTOCOL_CMD_COUNTER_FINISH_STATE_RESPONSE = 408;

module.exports.COUNTER_HANDLER_TIME_DETAY = 1000;
module.exports.COUNTER_INVALID_STAGE_TIME_SECTION = 6000;

module.exports.COUNTER_CONSENSUS_STAGE_TRIGGER_THRESHOULD = 3;
module.exports.COUNTER_CONSENSUS_STAGE_TRIGGER_MAX_SIZE = 50

module.exports.COUNTER_CONSENSUS_ACTION_FETCH_NEW_TRANSACTIONS_AND_AMALGAMATE = 1;
module.exports.COUNTER_CONSENSUS_ACTION_REUSE_CACHED_TRANSACTIONS_AND_AMALGAMATE_BECAUSE_OF_TRANSACTION_CONSENSUS_FAILED = 2;
module.exports.COUNTER_CONSENSUS_ACTION_REUSE_CACHED_TRANSACTIONS_AND_AMALGAMATE_BECAUSE_OF_STAGE_FALL_BEHIND = 3;

// Perish
module.exports.PROTOCOL_CMD_KILL_NODE_INFO_REQUEST = 500;
module.exports.PROTOCOL_CMD_KILL_NODE_INFO_RESPONSE = 501;
module.exports.PROTOCOL_CMD_KILL_NODE_REQUEST = 502;
module.exports.PROTOCOL_CMD_KILL_NODE_RESPONSE = 503;
module.exports.PROTOCOL_CMD_KILL_NODE_FINISH_STATE_REQUEST = 504;
module.exports.PROTOCOL_CMD_KILL_NODE_FINISH_STATE_RESPONSE = 505;

//
module.exports.TRANSACTIONS_CONSENSUS_THRESHOULD = 0.8;

// timeout reason
module.exports.TIMEOUT_REASON_OFFLINE = 'offline';
module.exports.TIMEOUT_REASON_DEFER = 'defer';
module.exports.TIMEOUT_REASON_SLOW = 'slow';

// cheat reason
module.exports.CHEAT_REASON_REPEAT_DATA_EXCHANGE = 'repeatDataExchange'
module.exports.CHEAT_REASON_REPEAT_SYNC_FINISH = 'repeatSyncFinish';
module.exports.CHEAT_REASON_INVALID_SIG = 'invalidSig';
module.exports.CHEAT_REASON_INVALID_ADDRESS = 'invalidAddress';
module.exports.CHEAT_REASON_INVALID_COUNTER_ACTION = 'invalidCounterAction';
module.exports.CHEAT_REASON_INVALID_PROTOCOL_CMD = 'invalidProtocolCmd';
module.exports.CHEAT_REASON_MALICIOUS_COUNTER_ACTION = 'maliciousCounterAction';
module.exports.CHEAT_REASON_REPEATED_COUNTER_DATA = 'repeatedCounterData';
module.exports.CHEAT_REASON_COUNTER_DATA_INVALID_TIMESTAMP = 'counterDataInvalidTimestamp';
module.exports.CHEAT_REASON_REPEATED_PERISH_DATA = 'repeatedPerishData';
module.exports.CHEAT_REASON_PERISH_DATA_INVALID_TIMESTAMP = 'perishDataInvalidTimestamp';

// data exchange type
module.exports.STAGE_SYNCHRONIZE_EMPTY_MODE = 0;
module.exports.STAGE_SYNCHRONIZE_SPREAD_MODE = 1;
module.exports.STAGE_SYNCHRONIZE_FETCH_MODE = 2;

// 
module.exports.STAGE_MAX_ID = 19901112
