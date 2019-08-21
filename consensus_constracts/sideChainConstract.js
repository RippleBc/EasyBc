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
const Buffer = utils.Buffer;

const COMMAND_NEW_AUTHORITY_ADDRESSES = 100;
const COMMAND_DEL_AUTHORITY_ADDRESSES = 101;
const COMMAND_AGREE = 102;
const COMMAND_REJECT = 103;
const COMMAND_CROSS_PAY = 104;

class SideChainConstract extends Constract {
  constructor(data) {
    super(SideChainConstract.id);

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
      name: "code",
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
      length: 200,
      name: "newAuthorityAddresses",
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      length: 200,
      name: "delAuthorityAddresses",
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
     * @property {Buffer} newAuthorityAddressesArray (read only).
     * @memberof Transaction
     */
    Object.defineProperty(this, "newAuthorityAddressesArray", {
      enumerable: false,
      configurable: true,
      get: function () {
        if (!this._newAuthorityAddressesArray) {
          this._newAuthorityAddressesArray = this.newAuthorityAddresses.length <= 0 ? [] : rlp.decode(this.newAuthorityAddresses);
        }

        return this._newAuthorityAddressesArray;
      }
    });

    /**
     * @property {Buffer} delAuthorityAddressesArray (read only).
     * @memberof Transaction
     */
    Object.defineProperty(this, "delAuthorityAddressesArray", {
      enumerable: false,
      configurable: true,
      get: function () {
        if (!this._delAuthorityAddressesArray) {
          this._delAuthorityAddressesArray = this.delAuthorityAddresses.length <= 0 ? [] : rlp.decode(this.delAuthorityAddresses);
        }

        return this._delAuthorityAddressesArray;
      }
    });
    
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
    assert(Buffer.isBuffer(timestamp), `SideChainConstract run, timestamp should be an Buffer, now is ${typeof timestamp}`);
    assert(stateManager instanceof StageManager, `SideChainConstract run, stateManager should be an instance of StageManager, now is ${typeof stateManager}`);
    assert(tx instanceof Transaction, `SideChainConstract run, tx should be an instance of Transaction, now is ${typeof tx}`);
    assert(fromAccount instanceof Account, `SideChainConstract run, fromAccount should be an instance of Account, now is ${typeof fromAccount}`);
    assert(toAccount instanceof Account, `SideChainConstract run, toAccount should be an instance of Account, now is ${typeof toAccount}`);

    const commands = rlp.decode(tx.data);

    const constractTimestampBn = new BN(this.timestamp);
    const timestampNowBn = new BN(timestamp);

    switch (bufferToInt(commands[0])) {
      case COMMAND_NEW_AUTHORITY_ADDRESSES:
      case COMMAND_DEL_AUTHORITY_ADDRESSES:
        {
          // check privilege
          if (undefined === this.authorityAddressesArray.find(el => {
            return el.toString("hex") === tx.from.toString("hex")
          })) {
            throw new Error(`SideChainConstract commandHandler authority addresses modify, address ${tx.from.toString("hex")} has not privilege`)
          }

          // check send state
          if (constractTimestampBn.add(new BN(this.expireInterval)).gt(timestampNowBn)) {
            throw new Error(`SideChainConstract commandHandler authority addresses modify, request has not expired`)
          }

          if (bufferToInt(commands[0]) === COMMAND_NEW_AUTHORITY_ADDRESSES)
          {
            // init newAuthorityAddresses
            this.newAuthorityAddresses = commands[1];
          }
          else
          {
            // init delAuthorityAddresses
            this.delAuthorityAddresses = commands[1];
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
      case COMMAND_REJECT:
        {
          // check privilege
          if (undefined === this.authorityAddressesArray.find(el => {
            return el.toString("hex") === tx.from.toString("hex")
          })) {
            throw new Error(`SideChainConstract commandHandler agree or reject, address ${tx.from.toString("hex")} has not privilege`)
          }

          // check opts
          if (this.newAuthorityAddresses.length <= 0 && this.delAuthorityAddresses.length <= 0) {
            throw new Error(`SideChainConstract commandHandler agree or reject, constract's authority addresses modify request is not exist`)
          }
          if (constractTimestampBn.add(new BN(this.expireInterval)).lt(timestampNowBn)) {
            throw new Error(`SideChainConstract commandHandler agree or reject, constract's authority addresses modify request has expired`)
          }

          if (bufferToInt(commands[0]) === COMMAND_AGREE)
          {
            await this.agree(stateManager, tx.from, toAccount, commands[1]);
          }
          else
          {
            this.reject(tx.from, commands[1]);
          }
        }
        break;
      default:
        {
          
        }
    }
  }

  /**
   * @param {Buffer} code  
   * @param {Buffer} expireInterval
   * @param {Buffer} threshold
   * @param {Buffer} authorityAddresses
   * @param {Buffer} timestamp
   * @param {StageManager} stateManager
   * @param {Transaction} tx
   * @param {Account} fromAccount
   * @param {Account} toAccount
   * @param {Mysql} mysql
   */
  async create(code, expireInterval, threshold, authorityAddresses, timestamp, stateManager, tx, fromAccount, toAccount, mysql) {
    assert(Buffer.isBuffer(code), `SideChainConstract create, code should be an Buffer, now is ${typeof code}`);
    assert(Buffer.isBuffer(expireInterval), `SideChainConstract create, expireInterval should be an Buffer, now is ${typeof expireInterval}`);
    assert(Buffer.isBuffer(threshold), `SideChainConstract create, threshold should be an Buffer, now is ${typeof threshold}`);
    assert(Buffer.isBuffer(authorityAddresses), `SideChainConstract create, authorityAddresses should be an Buffer, now is ${typeof authorityAddresses}`);
    assert(Buffer.isBuffer(timestamp), `SideChainConstract create, timestamp should be an Buffer, now is ${typeof timestamp}`);
    assert(stateManager instanceof StageManager, `SideChainConstract create, stateManager should be an instance of StageManager, now is ${typeof stateManager}`);
    assert(tx instanceof Transaction, `SideChainConstract create, tx should be an instance of Transaction, now is ${typeof tx}`);
    assert(fromAccount instanceof Account, `SideChainConstract create, fromAccount should be an instance of Account, now is ${typeof fromAccount}`);
    assert(toAccount instanceof Account, `SideChainConstract create, toAccount should be an instance of Account, now is ${typeof toAccount}`);

    this.code = code;
    this.expireInterval = expireInterval;
    this.threshold = threshold;
    this.authorityAddresses = authorityAddresses;

    const [sideChainConstract, created] = await mysql.saveSideChainConstract(code, tx.to);
    if (created) {
      return;
    }

    const sideChainConstractAccount = await stateManager.cache.getOrLoad(Buffer.from(sideChainConstract.address, "hex"));
    if (sideChainConstractAccount.isEmpty()) {
      await mysql.updateSideChainConstract(code, tx.to);
    }
    else
    {
      throw new Error(`SideChainConstract create, repeated sideChainConstract`);
    }
  }

  /**
   * @param {stateManager} stateManager
   * @param {Buffer} from
   * @param {Account} toAccount
   * @param {Buffer} timestamp
   */
  async agree(stateManager, from, constractAccount, timestamp) {
    assert(stateManager instanceof StageManager, `SideChainConstract agree, stateManager should be an instance of StageManager, now is ${typeof stateManager}`);
    assert(Buffer.isBuffer(from), `SideChainConstract agree, from should be an Buffer, now is ${typeof from}`);
    assert(constractAccount instanceof Account, `SideChainConstract agree, constractAccount should be an instance of Account, now is ${typeof constractAccount}`);
    assert(Buffer.isBuffer(timestamp), `SideChainConstract agree, timestamp should be an Buffer, now is ${typeof timestamp}`);

    // check timetamp
    if (this.timestamp.toString("hex") !== timestamp.toString("hex")) {
      throw new Error(`SideChainConstract agree, invalid timestamp`)
    }

    // check repeat
    if (this.agreeAddressesArray.find(el => el.toString("hex") === from.toString("hex"))) {
      throw new Error(`SideChainConstract agree, repeat agree, address ${from.toString("hex")}`);
    }
    if (this.rejectAddressesArray.find(el => el.toString("hex") === from.toString("hex"))) {
      throw new Error(`SideChainConstract agree, repeat reject, address ${from.toString("hex")}`);
    }

    this.agreeAddressesArray.push(from);

    if (this.agreeAddressesArray.length / this.authorityAddressesArray.length >= bufferToInt(this.threshold) / 100) {

      if (this.newAuthorityAddressesArray.length > 0)
      {
        for (let newAuthorityAddress of this.newAuthorityAddressesArray) {
          if (undefined === this.authorityAddressesArray.find(authorityAddress => {
            return authorityAddress.toString('hex') === newAuthorityAddress.toString('hex');
          }))
          {
            this.authorityAddressesArray.push(newAuthorityAddress);
          }
        }

        this.authorityAddresses = this.encodeArray(this.authorityAddressesArray)
      }
      else
      {
        const addresses = [];

        for (let authorityAddress of this.authorityAddressesArray) {
         if(undefined === this.delAuthorityAddressesArray.find(delAuthorityAddress => {
            return delAuthorityAddress.toString('hex') === authorityAddress.toString('hex');
          }))
          {
           addresses.push(authorityAddress);
          }
        }

        this.authorityAddresses = this.encodeArray(addresses);
      }

      this.reset();
    }
    else {
      this.agreeAddresses = this.encodeArray(this.agreeAddressesArray);
    }
  }

  /**
   * @param {Buffer} from
   * @param {Buffer} timestamp
   */
  reject(from, timestamp) {
    assert(Buffer.isBuffer(from), `SideChainConstract reject, from should be an Buffer, now is ${typeof from}`);
    assert(Buffer.isBuffer(timestamp), `SideChainConstract reject, timestamp should be an Buffer, now is ${typeof timestamp}`);

    // check timetamp
    if (this.timestamp.toString("hex") !== timestamp.toString("hex")) {
      throw new Error(`SideChainConstract reject, invalid timestamp`)
    }

    // check repeat
    if (this.agreeAddressesArray.find(el => el.toString("hex") === from.toString("hex"))) {
      throw new Error(`SideChainConstract reject, repeat agree, address ${from.toString("hex")}`);
    }
    if (this.rejectAddressesArray.find(el => el.toString("hex") === from.toString("hex"))) {
      throw new Error(`SideChainConstract reject, repeat reject, address ${from.toString("hex")}`);
    }

    this.rejectAddressesArray.push(from);

    if (this.rejectAddressesArray.length / this.authorityAddressesArray.length > (1 - bufferToInt(this.threshold) / 100)) {
      this.reset();
    }
    else {
      this.rejectAddresses = this.encodeArray(this.rejectAddressesArray);
    }
  }

  reset() {
    this.newAuthorityAddresses = Buffer.alloc(0);
    this.delAuthorityAddresses = Buffer.alloc(0);
    this.timestamp = Buffer.alloc(0);
    this.agreeAddresses = Buffer.alloc(0);
    this.rejectAddresses = Buffer.alloc(0);
  }
}

SideChainConstract.id = "03";

module.exports = SideChainConstract;