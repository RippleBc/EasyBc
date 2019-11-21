const assert = require("assert");
const Message = require("../depends/fly/net/message")
const { PROTOCOL_CMD_TRANSACTION_AMALGAMATE_REQ,
    PROTOCOL_CMD_TRANSACTION_AMALGAMATE_RES,
    PROTOCOL_CMD_PRE_PREPARE_REQ,
    PROTOCOL_CMD_PRE_PREPARE_RES,
    PROTOCOL_CMD_PREPARE,
    PROTOCOL_CMD_COMMIT,
    PROTOCOL_CMD_CONSENSUS_CANDIDATE_REQ,
    PROTOCOL_CMD_CONSENSUS_CANDIDATE_RES,
    PROTOCOL_CMD_VIEW_CHANGE_FOR_CONSENSUS_FAIL,
    PROTOCOL_CMD_VIEW_CHANGE_FOR_TIMEOUT,
    PROTOCOL_CMD_NEW_VIEW_REQ,
    PROTOCOL_CMD_NEW_VIEW_RES,
    PROTOCOL_CMD_PROCESS_STATE_REQ,
    PROTOCOL_CMD_PROCESS_STATE_RES } = require("../consensus_full_server/ripple/constants");
const Candidate = require("../consensus_full_server/ripple/data/candidate");
const CandidateDigest = require("../consensus_full_server/ripple/data/candidateDigest");
const NewView = require("../consensus_full_server/ripple/data/newView");
const ViewChange = require("../consensus_full_server/ripple/data/viewChange");
const utils = require("../depends/utils");

const rlp = utils.rlp;
const bufferToInt = utils.bufferToInt;

const p2p = process[Symbol.for("p2p")]
const logger = process[Symbol.for("loggerProxy")];

class Processor {
    constructor()
    {

    }

    /**
     * @param {Message} data 
     */
    handleMessage(message)
    {
        assert(message instanceof Message, `Processor handleMessage, message should be a Message Object, now is ${typeof message}`);

        const cmd = bufferToInt(message.cmd);
        const data = message.data;

        switch(cmd)
        {
            case PROTOCOL_CMD_TRANSACTION_AMALGAMATE_REQ:
            case PROTOCOL_CMD_TRANSACTION_AMALGAMATE_RES:
            case PROTOCOL_CMD_PRE_PREPARE_REQ:
            case PROTOCOL_CMD_PRE_PREPARE_RES:
            case PROTOCOL_CMD_NEW_VIEW_RES:
            case PROTOCOL_CMD_PROCESS_STATE_REQ:
            case PROTOCOL_CMD_PROCESS_STATE_RES:
            case PROTOCOL_CMD_CONSENSUS_CANDIDATE_RES:
                {
                    const candidate = new Candidate(data);

                    p2p.send(cmd, rlp.encode([candidate.from, data]));
                }
                break;
            case PROTOCOL_CMD_PREPARE:
            case PROTOCOL_CMD_COMMIT:
            case PROTOCOL_CMD_CONSENSUS_CANDIDATE_REQ:
                {
                    const candidateDigest = new CandidateDigest(data);

                    p2p.send(cmd, rlp.encode([candidateDigest.from, data]));
                }
                break;
            case PROTOCOL_CMD_VIEW_CHANGE_FOR_CONSENSUS_FAIL:
            case PROTOCOL_CMD_VIEW_CHANGE_FOR_TIMEOUT:
                {
                    const viewChange = new ViewChange(data);

                    p2p.send(cmd, rlp.encode([viewChange.from, data]));
                }
                break;
            case PROTOCOL_CMD_NEW_VIEW_REQ:
                {
                    const newView = new NewView(data);

                    p2p.send(cmd, rlp.encode([newView.from, data]));
                }
                break;
            
               
        }
    }
}

module.exports = Processor;