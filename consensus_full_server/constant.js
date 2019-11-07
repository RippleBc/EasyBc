module.exports.MAX_PROCESS_TRANSACTIONS_SIZE = 100;

// stage 
module.exports.STAGE_AMALGAMATE_TRANSACTIONS_EXPIRATION = 2000;
module.exports.STAGE_PRE_PREPARE_EXPIRATION = 500;
module.exports.STAGE_PREPARE_EXPIRATION = 2000;
module.exports.STAGE_COMMIT_EXPIRATION = 2000;
module.exports.STAGE_FETCH_CANDIDATE_EXPIRATION = 500;

module.exports.STAGE_STATE_EMPTY = 1;
module.exports.STAGE_STATE_PROCESSING = 2;
module.exports.STAGE_STATE_FINISH = 3;

// ripple
module.exports.RIPPLE_STAGE_EMPTY = 1;
module.exports.RIPPLE_STAGE_AMALGAMATE = 2;
module.exports.RIPPLE_STAGE_PRE_PREPARE = 3;
module.exports.RIPPLE_STAGE_PREPARE = 4;
module.exports.RIPPLE_STAGE_COMMIT = 5;
module.exports.RIPPLE_STAGE_FETCH_CANDIDATE = 6;
module.exports.RIPPLE_STAGE_VIEW_CHANGE = 7;

// amalgamate
module.exports.PROTOCOL_CMD_TRANSACTION_AMALGAMATE_REQ = 100;
module.exports.PROTOCOL_CMD_TRANSACTION_AMALGAMATE_RES = 101;

// prePrepare
module.exports.PROTOCOL_CMD_PRE_PREPARE_REQ = 200;
module.exports.PROTOCOL_CMD_PRE_PREPARE_RES = 201;

// prepare
module.exports.PROTOCOL_CMD_PREPARE = 200;

// commit
module.exports.PROTOCOL_CMD_COMMIT = 300;

// fetch candidate
module.exports.PROTOCOL_CMD_CONSENSUS_CANDIDATE_REQ = 400;
module.exports.PROTOCOL_CMD_CONSENSUS_CANDIDATE_RES = 401;

// cheat reason
module.exports.CHEAT_REASON_REPEAT_DATA_EXCHANGE = 'repeatDataExchange';
module.exports.CHEAT_REASON_INVALID_SIG = 'invalidSig';
module.exports.CHEAT_REASON_INVALID_ADDRESS = 'invalidAddress';
module.exports.CHEAT_REASON_INVALID_PROTOCOL_CMD = 'invalidProtocolCmd';
