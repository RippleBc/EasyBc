module.exports.MAX_PROCESS_TRANSACTIONS_SIZE = 100;

// stage 
module.exports.STAGE_AMALGAMATE_TRANSACTIONS_EXPIRATION = 2000;
module.exports.STAGE_PRE_PREPARE_EXPIRATION = 500;
module.exports.STAGE_PREPARE_EXPIRATION = 2000;
module.exports.STAGE_COMMIT_EXPIRATION = 2000;
module.exports.STAGE_VIEW_CHANGE_FOR_CONSENSUS_FAIL_EXPIRATION = 2000;

//
module.exports.RIPPLE_STATE_FETCH_CONSENSUS_CANDIDATE_EXPIRATION = 500;
module.exports.RIPPLE_STATE_VIEW_CHANGE_NEW_VIEW_EXPIRATION = 2000;
module.exports.RIPPLE_STATE_FETCH_PROCESS_STATE_EXPIRATION = 2000;

module.exports.STAGE_AMALGAMATE = 1;
module.exports.STAGE_PRE_PREPARE = 2;
module.exports.STAGE_PREPARE = 3;
module.exports.STAGE_COMMIT = 4;
module.exports.STAGE_FETCH_CANDIDATE = 5;
module.exports.STAGE_PROCESS_CONSENSUS_CANDIDATE = 3;

module.exports.STAGE_STATE_EMPTY = 1;
module.exports.STAGE_STATE_PROCESSING = 2;
module.exports.STAGE_STATE_FINISH = 3;

module.exports.STAGE_FINISH_FOR_TIMEOUT = 1;
module.exports.STAGE_FINISH_FOR_ALL_NODES_RETURN = 2;
module.exports.STAGE_FINISH_SUCCESS = 3;

// ripple
module.exports.RIPPLE_STATE_EMPTY = 1;
module.exports.RIPPLE_STATE_CONSENSUS = 2;
module.exports.RIPPLE_STATE_VIEW_CHANGE_FOR_CONSENSUS_FAIL = 3;
module.exports.RIPPLE_STATE_NEW_VIEW = 4;
module.exports.RIPPLE_STATE_FETCH_PROCESS_STATE = 5;

module.exports.RIPPLE_LEADER_EXPIRATION = 10000;

// amalgamate
module.exports.PROTOCOL_CMD_TRANSACTION_AMALGAMATE_REQ = 100;
module.exports.PROTOCOL_CMD_TRANSACTION_AMALGAMATE_RES = 101;

// prePrepare
module.exports.PROTOCOL_CMD_PRE_PREPARE_REQ = 200;
module.exports.PROTOCOL_CMD_PRE_PREPARE_RES = 201;

// prepare
module.exports.PROTOCOL_CMD_PREPARE = 300;

// commit
module.exports.PROTOCOL_CMD_COMMIT = 400;

// fetch candidate
module.exports.PROTOCOL_CMD_CONSENSUS_CANDIDATE_REQ = 500;
module.exports.PROTOCOL_CMD_CONSENSUS_CANDIDATE_RES = 501;

// view change
module.exports.PROTOCOL_CMD_VIEW_CHANGE_FOR_CONSENSUS_FAIL = 600;
module.exports.PROTOCOL_CMD_VIEW_CHANGE_FOR_TIMEOUT = 601;

// new view
module.exports.PROTOCOL_CMD_NEW_VIEW_REQ = 700;
module.exports.PROTOCOL_CMD_NEW_VIEW_RES = 701;

// process state
module.exports.PROTOCOL_CMD_PROCESS_STATE_REQ = 800;
module.exports.PROTOCOL_CMD_PROCESS_STATE_RES = 801;

// cheat reason
module.exports.CHEAT_REASON_REPEAT_DATA_EXCHANGE = 'repeatDataExchange';
module.exports.CHEAT_REASON_INVALID_SIG = 'invalidSig';
module.exports.CHEAT_REASON_INVALID_ADDRESS = 'invalidAddress';
module.exports.CHEAT_REASON_INVALID_PROTOCOL_CMD = 'invalidProtocolCmd';
