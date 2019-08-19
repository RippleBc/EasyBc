const assert = require("assert");
const Account = require("../depends/account");
const utils = require("../depends/utils");
const StageManager = require("../depends/block_chain/stateManager");
const Transaction = require("../depends/transaction");
const { STATE_DESTROYED } = require("./constant");
const Constract = require("./constract");

const rlp = utils.rlp;
const BN = utils.BN;
const bufferToInt = utils.bufferToInt;

const COMMAND_SEND = 100;
const COMMAND_AGREE= 101;
const COMMAND_REJECT = 102;

class MultiSignConstract extends Constract {
    constructor(data) {
        super(MultiSignConstract.id);

        data = data || {};

        let fields = [{
            length: 32,
            name: "id",
            allowLess: true,
            default: Buffer.alloc(1)
        }, {
            length: 32,
            name: "state",
            allowLess: true,
            default: Buffer.alloc(1)
        }, {
            length: 32,
            name: "timestamp",
            allowLess: true,
            allowZero: true,
            default: Buffer.alloc(0)
        }, {
            length: 32,
            name: "expireInterval",
            allowLess: true,
            default: Buffer.alloc(1)
        }, {
            length: 20,
            name: "to",
            allowZero: true,
            allowLess: true,
            default: Buffer.alloc(0)
        }, {
            length: 32,
            name: "value",
            allowZero: true,
            allowLess: true,
            default: Buffer.alloc(0)
        }, {
            length: 2,
            name: "threshold",
            allowLess: true,
            default: Buffer.alloc(1)
        }, {
            length: 200,
            name: "authorityAddresses",
            allowLess: true,
            default: Buffer.alloc(1)
        }, {
            length: 200,
            name: "agreeAddresses",
            allowZero: true,
            allowLess: true,
            default: Buffer.alloc(0)
        }, {
            length: 200,
            name: "rejectAddresses",
            allowZero: true,
            allowLess: true,
            default: Buffer.alloc(0)
        }];

        utils.defineProperties(this, fields, data);

        /**
         * @property {Buffer} authorityAddressesArray (read only).
         * @memberof Transaction
         */
        Object.defineProperty(this, "authorityAddressesArray", {
            enumerable: false,
            configurable: true,
            get: function () {
                if (!this._authorityAddressesArray) {
                    this._authorityAddressesArray = this.authorityAddresses.length <= 0 ? [] : rlp.decode(this.authorityAddresses);
                }

                return this._authorityAddressesArray;
            }
        });

        /**
         * @property {Buffer} agreeAddressesArray (read only).
         * @memberof Transaction
         */
        Object.defineProperty(this, "agreeAddressesArray", {
            enumerable: false,
            configurable: true,
            get: function () {
                if (!this._agreeAddressesArray) {
                    this._agreeAddressesArray = this.agreeAddresses.length <= 0 ? [] : rlp.decode(this.agreeAddresses);
                }

                return this._agreeAddressesArray;
            }
        });

        /**
         * @property {Buffer} rejectAddressesArray (read only).
         * @memberof Transaction
         */
        Object.defineProperty(this, "rejectAddressesArray", {
            enumerable: false,
            configurable: true,
            get: function () {
                if (!this._rejectAddressesArray) {
                    this._rejectAddressesArray = this.rejectAddresses.length <= 0 ? [] : rlp.decode(this.rejectAddresses);
                }

                return this._rejectAddressesArray;
            }
        });
    }

    /**
     * @param {Buffer} timestamp
     * @param {StageManager} stateManager
     * @param {Transaction} tx
     * @param {Account} fromAccount
     * @param {Account} toAccount
     */
    async commandHandler(timestamp, stateManager, tx, fromAccount, toAccount) {
        assert(Buffer.isBuffer(timestamp), `MultiSignConstract run, timestamp should be an Buffer, now is ${typeof timestamp}`);
        assert(stateManager instanceof StageManager, `MultiSignConstract run, stateManager should be an instance of StageManager, now is ${typeof stateManager}`);
        assert(tx instanceof Transaction, `MultiSignConstract run, tx should be an instance of Transaction, now is ${typeof tx}`);
        assert(fromAccount instanceof Account, `MultiSignConstract run, fromAccount should be an instance of Account, now is ${typeof fromAccount}`);
        assert(toAccount instanceof Account, `MultiSignConstract run, toAccount should be an instance of Account, now is ${typeof toAccount}`);

        const commands = rlp.decode(tx.data);

        const constractTimestampBn = new BN(this.timestamp);
        const timestampNowBn = new BN(timestamp);

        switch (bufferToInt(commands[0])) {
            case COMMAND_SEND:
                {
                    // check privilege
                    if (undefined === this.authorityAddressesArray.find(el => { 
                        return el.toString("hex") === tx.from.toString("hex")
                    })) {
                        throw new Error(`MultiSignConstract commandHandler, address ${tx.from.toString("hex")} has not privilege`)
                    }

                    // check send state
                    if(constractTimestampBn.add(new BN(this.expireInterval)).gt(timestampNowBn))
                    {
                        throw new Error(`MultiSignConstract commandHandler send, constract's send request has not expired`)
                    }

                    // check value
                    this.to = commands[1];
                    this.value = commands[2];
                    if (new BN(toAccount.balance).lt(new BN(this.value)))
                    {
                        throw new Error(`MultiSignConstract commandHandler send, constract's value is not enough, constract balance is ${bufferToInt(toAccount.balance)}, need ${bufferToInt(this.value)}`);
                    }

                    // init timestamp
                    this.timestamp = timestamp;

                    //
                    this._agreeAddressesArray = [];
                    this._rejectAddressesArray = [];
                    this.rejectAddresses = Buffer.alloc(0);

                    await this.agree(stateManager, tx.from, toAccount, timestamp);
                }
                break;

            case COMMAND_AGREE:
                {
                    // check privilege
                    if (undefined === this.authorityAddressesArray.find(el => {
                        return el.toString("hex") === tx.from.toString("hex")
                    })) {
                        throw new Error(`MultiSignConstract commandHandler, address ${tx.from.toString("hex")} has not privilege`)
                    }

                    // check send state
                    if (this.to.length <= 0 || this.value.length <= 0)
                    {
                        throw new Error(`MultiSignConstract commandHandler agree, constract's send request is not exist`)
                    }
                    if (constractTimestampBn.add(new BN(this.expireInterval)).lt(timestampNowBn)) {
                        throw new Error(`MultiSignConstract commandHandler agree, constract's send request has expired`)
                    }

                    await this.agree(stateManager, tx.from, toAccount, commands[1]);
                }
                break;

            case COMMAND_REJECT:
                {
                    // check privilege
                    if (undefined === this.authorityAddressesArray.find(el => {
                        return el.toString("hex") === tx.from.toString("hex")
                    })) {
                        throw new Error(`MultiSignConstract commandHandler, address ${tx.from.toString("hex")} has not privilege`)
                    }

                    // check send state
                    if (this.to.length <= 0 || this.value.length <= 0) {
                        throw new Error(`MultiSignConstract commandHandler reject, constract's send request is not exist`)
                    }
                    if (constractTimestampBn.add(new BN(this.expireInterval)).lt(timestampNowBn)) {
                        throw new Error(`MultiSignConstract commandHandler reject, constract's send request has expired`)
                    }

                    this.reject(tx.from, commands[1]);
                }
                break;
            default:
                {

                }
        }
    }

    /**
     * @param {Buffer} expireInterval
     * @param {Buffer} threshold
     * @param {Buffer} authorityAddresses
     */
    create(expireInterval, threshold, authorityAddresses) {
        assert(Buffer.isBuffer(expireInterval), `MultiSignConstract create, expireInterval should be an Buffer, now is ${typeof expireInterval}`);
        assert(Buffer.isBuffer(threshold), `MultiSignConstract create, threshold should be an Buffer, now is ${typeof threshold}`);
        assert(Buffer.isBuffer(authorityAddresses), `MultiSignConstract create, authorityAddresses should be an Buffer, now is ${typeof authorityAddresses}`);

        this.expireInterval = expireInterval;
        this.threshold = threshold;
        this.authorityAddresses = authorityAddresses;
    }

    /**
     * @param {stateManager} stateManager
     * @param {Buffer} from
     * @param {Account} constractAccount
     * @param {Buffer} timestamp
     */
    async agree(stateManager, from, constractAccount, timestamp) {
        assert(stateManager instanceof StageManager, `MultiSignConstract agree, stateManager should be an instance of StageManager, now is ${typeof stateManager}`);
        assert(Buffer.isBuffer(from), `MultiSignConstract agree, from should be an Buffer, now is ${typeof from}`);
        assert(constractAccount instanceof Account, `MultiSignConstract agree, constractAccount should be an instance of Account, now is ${typeof constractAccount}`);
        assert(Buffer.isBuffer(timestamp), `MultiSignConstract agree, timestamp should be an Buffer, now is ${typeof timestamp}`);

        // check timetamp
        if (this.timestamp.toString("hex") !== timestamp.toString("hex")) {
            throw new Error(`MultiSignConstract agree, invalid timestamp`)
        }

        // check repeat
        if (this.agreeAddressesArray.find(el => el.toString("hex") === from.toString("hex"))) {
            throw new Error(`MultiSignConstract agree, repeat agree, address ${from.toString("hex")}`);
        }
        if (this.rejectAddressesArray.find(el => el.toString("hex") === from.toString("hex"))) {
            throw new Error(`MultiSignConstract agree, repeat reject, address ${from.toString("hex")}`);
        }

        this.agreeAddressesArray.push(from);
        
        if (this.agreeAddressesArray.length / this.authorityAddressesArray.length >= bufferToInt(this.threshold) / 100)
        {
            // get to account
            const toAccount = await stateManager.cache.getOrLoad(this.to);

            // update toAccount balance
            toAccount.balance = new BN(toAccount.balance).add(new BN(this.value)).toBuffer();

            // update constract balance
            constractAccount.balance = new BN(constractAccount.balance).sub(new BN(this.value)).toBuffer();
            
            await stateManager.putAccount(this.to, toAccount.serialize());

            this.reset();
        }
        else
        {
            this.agreeAddresses = this.encodeArray(this.agreeAddressesArray);
        }
    }

    /**
     * @param {Buffer} from
     * @param {Buffer} timestamp
     */
    reject(from, timestamp) {
        assert(Buffer.isBuffer(from), `MultiSignConstract reject, from should be an Buffer, now is ${typeof from}`);
        assert(Buffer.isBuffer(timestamp), `MultiSignConstract reject, timestamp should be an Buffer, now is ${typeof timestamp}`);

        // check timetamp
        if(this.timestamp.toString("hex") !== timestamp.toString("hex"))
        {
            throw new Error(`MultiSignConstract reject, invalid timestamp`)
        }

        // check repeat
        if (this.agreeAddressesArray.find(el => el.toString("hex") === from.toString("hex"))) {
            throw new Error(`MultiSignConstract reject, repeat agree, address ${from.toString("hex")}`);
        }
        if (this.rejectAddressesArray.find(el => el.toString("hex") === from.toString("hex"))) {
            throw new Error(`MultiSignConstract reject, repeat reject, address ${from.toString("hex")}`);
        }

        this.rejectAddressesArray.push(from);

        if (this.rejectAddressesArray.length / this.authorityAddressesArray.length > (1 - bufferToInt(this.threshold) / 100)) {
            this.reset();
        }
        else {
            this.rejectAddresses = this.encodeArray(this.rejectAddressesArray);
        }
    }

    reset()
    {
        this.to = Buffer.alloc(0);
        this.value = Buffer.alloc(0);
        this.timestamp = Buffer.alloc(0);
        this.agreeAddresses = Buffer.alloc(0);
        this.rejectAddresses = Buffer.alloc(0);
    }
}

MultiSignConstract.id = "02";

module.exports = MultiSignConstract;