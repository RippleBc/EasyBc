module.exports.MAX_PROCESS_TRANSACTIONS_SIZE = 100;

// stage 
module.exports.STAGE_PREPARE_EXPIRATION = 2000;
module.exports.STAGE_COMMIT_EXPIRATION = 2000;

module.exports.STAGE_STATE_EMPTY = 1;
module.exports.STAGE_STATE_PROCESSING = 2;
module.exports.STAGE_STATE_FINISH = 3;

// ripple
module.exports.RIPPLE_STAGE_EMPTY = 1;
module.exports.RIPPLE_STAGE_PRE_PREPARE = 2;
module.exports.RIPPLE_STAGE_PREPARE = 3;
module.exports.RIPPLE_STAGE_COMMIT = 4;

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

// cheat reason
module.exports.CHEAT_REASON_REPEAT_DATA_EXCHANGE = 'repeatDataExchange';
module.exports.CHEAT_REASON_INVALID_SIG = 'invalidSig';
module.exports.CHEAT_REASON_INVALID_ADDRESS = 'invalidAddress';
module.exports.CHEAT_REASON_INVALID_PROTOCOL_CMD = 'invalidProtocolCmd';
