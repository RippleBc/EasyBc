module.exports.MAX_PROCESS_TRANSACTIONS_SIZE = 100;

// stage 
module.exports.STAGE_STATE_EXPIRATION = 2000;

module.exports.STAGE_STATE_EMPTY = 1;
module.exports.STAGE_STATE_PROCESSING = 2;
module.exports.STAGE_STATE_FINISH = 3;

// ripple
module.exports.RIPPLE_STAGE_EMPTY = 0;
module.exports.RIPPLE_STAGE_AMALGAMATE = 1;
module.exports.RIPPLE_STAGE_BLOCK_AGREEMENT = 3;

// amalgamate
module.exports.PROTOCOL_CMD_TRANSACTION_AMALGAMATE_REQ = 100;
module.exports.PROTOCOL_CMD_TRANSACTION_AMALGAMATE_RES = 101;

// prePrepare
module.exports.PROTOCOL_CMD_PRE_PREPARE_REQ = 200;
module.exports.PROTOCOL_CMD_PRE_PREPARE_RES = 201;

// candidate agreement
module.exports.PROTOCOL_CMD_CANDIDATE_AGREEMENT = 200;

// block agreement
module.exports.PROTOCOL_CMD_BLOCK_AGREEMENT = 300;

// cheat reason
module.exports.CHEAT_REASON_REPEAT_DATA_EXCHANGE = 'repeatDataExchange';
module.exports.CHEAT_REASON_INVALID_SIG = 'invalidSig';
module.exports.CHEAT_REASON_INVALID_ADDRESS = 'invalidAddress';
module.exports.CHEAT_REASON_INVALID_PROTOCOL_CMD = 'invalidProtocolCmd';
