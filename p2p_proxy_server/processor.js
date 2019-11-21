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
const RippleDataBase = require("../consensus_full_server/ripple/data/base");
const utils = require("../depends/utils");
const Transaction = require("../depends/transaction");
const { randomBytes } = require("crypto");

const rlp = utils.rlp;
const bufferToInt = utils.bufferToInt;
const createPrivateKey = utils.createPrivateKey;

const p2p = process[Symbol.for("p2p")]
const logger = process[Symbol.for("loggerProxy")];

const nodesDetail = {
    "5a8fbde736795f7ef2ebff7cda09d8133da34d0b": "bfd549bfbbb41498b290bfdbefc1810aacf83463ba949569975220b3ceaaa1e0",
    "68ecab823675efa71e2edbe26a56b7a0d765dcde": "e29f99d13a92f788e46cec235ffbde9e64360bd1bd9e68e18ecac2e433fd6fce",
    "a20e4e1f76c64d8ba70237df08e15dfeb4c5f0f1": "a8ae1cedfe4cde02f45df6cf684a5612f59e110b29bbbeeec5e5886e6d2a6c0c",
    "059f8dc90879230fa7d51b6177b91d75c12bde4e": "c579cce6ddb05ea154369a4bbe5d56a2ecd4f94916207751541a204bca6c608f",
    "924ee9ba3f1a671d4cece8b6178fb66a19cf04a7": "f71f8d9325f7786036fcb62282684beb1243a6001efa28552f8b74ed180793fc"
}

/**
 * @param {String} address
 */
function getPrivateKeyByAddress(address)
{
    return Buffer.from(nodesDetail[address], 'hex');
}

class Processor {
    constructor()
    {
        this.maliciousLeaderCandidate = false;
        this.maliciousLeaderRejectServe = false;
        this.privateKey = createPrivateKey();
    }

    /**
     * @param {String} sequence
     * @param {String} sequence
     * @param {String} sequence
     * @param {String} sequence
     */
    setMaliciousLeaderCandidate({ sequence, view, hash, number })
    {
        this.maliciousLeaderCandidate = true;
    }

    repealMaliciousLeaderCandidate() {
        this.maliciousLeaderCandidate = false;
    }

    /**
     * @param {String} sequence
     * @param {String} sequence
     * @param {String} sequence
     * @param {String} sequence
     */
    setMaliciousLeaderRejectServe({ sequence, view, hash, number }) {
        this.maliciousLeaderRejectServe = true;
    }

    repealMaliciousLeaderRejectServe() {
        this.maliciousLeaderRejectServe = false;
    }

    /**
     * @param {Message} data 
     */
    handleMessage(message)
    {
        assert(message instanceof Message, `Processor handleMessage, message should be a Message Object, now is ${typeof message}`);

        const cmd = bufferToInt(message.cmd);
        let data = message.data;

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
                    // leader reject serve
                    if((cmd === PROTOCOL_CMD_TRANSACTION_AMALGAMATE_REQ
                        || cmd === PROTOCOL_CMD_PRE_PREPARE_REQ)
                        && this.maliciousLeaderRejectServe)
                    {
                        return;
                    }

                    const candidate = new Candidate(data);

                    // leader send malicious candidate
                    if (cmd === PROTOCOL_CMD_PRE_PREPARE_REQ
                        && this.maliciousLeaderCandidate)
                    {
                        // get from address
                        const fromAddress = candidate.from;

                        // init a random tx
                        const tx = new Transaction({
                            nonce: randomBytes(1),
                            timestamp: Date.now(),
                            to: randomBytes(20),
                            value: randomBytes(32)
                        });
                        tx.sign(this.privateKey);

                        // reconstruct transactions
                        candidate.transactions = rlp.encode([tx.serialize()]);

                        // sign again
                        const privateKey = getPrivateKeyByAddress(fromAddress.toString('hex'));
                        candidate.sign(privateKey);

                        //
                        data = candidate.serialize();
                    }

                    //
                    data = rlp.encode([candidate.from, data]);
                }
                break;
            case PROTOCOL_CMD_PREPARE:
            case PROTOCOL_CMD_COMMIT:
            case PROTOCOL_CMD_CONSENSUS_CANDIDATE_REQ:
                {
                    const candidateDigest = new CandidateDigest(data);

                    data = rlp.encode([candidateDigest.from, data]);
                }
                break;
            case PROTOCOL_CMD_VIEW_CHANGE_FOR_CONSENSUS_FAIL:
            case PROTOCOL_CMD_VIEW_CHANGE_FOR_TIMEOUT:
                {
                    const viewChange = new ViewChange(data);

                    data = rlp.encode([viewChange.from, data]);
                }
                break;
            case PROTOCOL_CMD_NEW_VIEW_REQ:
                {
                    const newView = new NewView(data);

                    data = rlp.encode([newView.from, data]);
                }
                break;
        }

        p2p.send(cmd, data);
    }
}

module.exports = Processor;