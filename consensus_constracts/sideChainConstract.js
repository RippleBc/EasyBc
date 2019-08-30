const assert = require("assert");
const Account = require("../depends/account");
const utils = require("../depends/utils");
const StateManager = require("../depends/block_chain/stateManager");
const ReceiptManager = require("../depends/block_chain/receiptManager");
const Transaction = require("../depends/transaction");
const { STATE_DESTROYED } = require("./constant");
const Constract = require("./constract");
const { CorssPayRequestEvent, CorssPayEvent, AppendGuaranteeEvent } = require("./events/sideChainConstractEvents");
const { code: selfChainCode, mainChainCode } = require("../globalConfig").blockChain;

const rlp = utils.rlp;
const BN = utils.BN;
const bufferToInt = utils.bufferToInt;
const Buffer = utils.Buffer;
const toBuffer = utils.toBuffer;

const COMMAND_NEW_AUTHORITY_ADDRESSES = 100;
const COMMAND_DEL_AUTHORITY_ADDRESSES = 101;
const COMMAND_AGREE = 102;
const COMMAND_REJECT = 103;
const COMMAND_CROSS_PAY = 104;
const COMMAND_APPEND_GUARANTEE = 105;

const SIDE_CHAIN_PAY_MAX_INTERVAL = 5 * 60 * 1000;

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
      name: "crossPayRequests",
      allowZero: true,
      default: Buffer.alloc(0)
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
     * @property {Buffer} crossPayRequestsArray (read only).
     * @memberof Transaction
     */
    Object.defineProperty(this, "crossPayRequestsArray", {
      enumerable: false,
      configurable: true,
      get: function () {
        if (!this._crossPayRequestsArray) {
          this._crossPayRequestsArray = this.crossPayRequests.length <= 0 ? [] : rlp.decode(this.crossPayRequests);
        }

        return this._crossPayRequestsArray;
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
   * @param {StateManager} stateManager
   * @param {ReceiptManager} receiptManager
   * @param {Transaction} tx
   * @param {Account} fromAccount
   * @param {Account} toAccount
   */
  async commandHandler({ timestamp, stateManager, receiptManager, tx, fromAccount, toAccount}) {
    assert(Buffer.isBuffer(timestamp), `SideChainConstract commandHandler, timestamp should be an Buffer, now is ${typeof timestamp}`);
    assert(stateManager instanceof StateManager, `SideChainConstract commandHandler, stateManager should be an instance of StateManager, now is ${typeof stateManager}`);
    assert(receiptManager instanceof ReceiptManager, `SideChainConstract commandHandler, receiptManager should be an instance of ReceiptManager, now is ${typeof receiptManager}`);
    assert(tx instanceof Transaction, `SideChainConstract commandHandler, tx should be an instance of Transaction, now is ${typeof tx}`);
    assert(fromAccount instanceof Account, `SideChainConstract commandHandler, fromAccount should be an instance of Account, now is ${typeof fromAccount}`);
    assert(toAccount instanceof Account, `SideChainConstract commandHandler, toAccount should be an instance of Account, now is ${typeof toAccount}`);

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
      case COMMAND_CROSS_PAY:
      {
          // check privilege
          if (undefined === this.authorityAddressesArray.find(el => {
            return el.toString("hex") === tx.from.toString("hex")
          })) {
            throw new Error(`SideChainConstract commandHandler cross pay, address ${tx.from.toString("hex")} has not privilege`)
          }

          await this.crossPay(stateManager, receiptManager, tx, timestamp, toAccount, commands[1])
      }
        break;
      case COMMAND_APPEND_GUARANTEE:
        {
          await this.appendGuarantee(receiptManager, tx);
        }
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
   * @param {StateManager} stateManager
   * @param {ReceiptManager} receiptManager
   * @param {Mysql} mysql
   * @param {Transaction} tx
   * @param {Account} fromAccount
   * @param {Account} toAccount
   */
  async create(code, expireInterval, threshold, authorityAddresses, { timestamp, stateManager, receiptManager, mysql, tx, fromAccount, toAccount}) {
    assert(Buffer.isBuffer(code), `SideChainConstract create, code should be an Buffer, now is ${typeof code}`);
    assert(Buffer.isBuffer(expireInterval), `SideChainConstract create, expireInterval should be an Buffer, now is ${typeof expireInterval}`);
    assert(Buffer.isBuffer(threshold), `SideChainConstract create, threshold should be an Buffer, now is ${typeof threshold}`);
    assert(Buffer.isBuffer(authorityAddresses), `SideChainConstract create, authorityAddresses should be an Buffer, now is ${typeof authorityAddresses}`);
    assert(Buffer.isBuffer(timestamp), `SideChainConstract create, timestamp should be an Buffer, now is ${typeof timestamp}`);
    assert(stateManager instanceof StateManager, `SideChainConstract create, stateManager should be an instance of StateManager, now is ${typeof stateManager}`);
    assert(receiptManager instanceof ReceiptManager, `SideChainConstract create, receiptManager should be an instance of ReceiptManager, now is ${typeof receiptManager}`);
    assert(tx instanceof Transaction, `SideChainConstract create, tx should be an instance of Transaction, now is ${typeof tx}`);
    assert(fromAccount instanceof Account, `SideChainConstract create, fromAccount should be an instance of Account, now is ${typeof fromAccount}`);
    assert(toAccount instanceof Account, `SideChainConstract create, toAccount should be an instance of Account, now is ${typeof toAccount}`);

    // check code
    if (this.code.toString('hex') === selfChainCode)
    {
      throw new Error(`SideChainConstract create, sideChainConstract's code should not be ${selfChainCode}, because of self chain code is ${selfChainCode}`)
    }

    this.code = code;
    this.expireInterval = expireInterval;
    this.threshold = threshold;
    this.authorityAddresses = authorityAddresses;

    const [sideChainConstract, created] = await mysql.saveSideChainConstract(code, tx.to);
    if (created) {
      return;
    }

    // check if correspond side chain constract is exist
    const sideChainConstractAccount = await stateManager.cache.getOrLoad(Buffer.from(sideChainConstract.address, "hex"));
    if (sideChainConstractAccount.isEmpty()) {
      // not exist, update sideChainConstract
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
    assert(stateManager instanceof StateManager, `SideChainConstract agree, stateManager should be an instance of StateManager, now is ${typeof stateManager}`);
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

  /**
   * 
   * @param {StateManager} stateManager
   * @param {ReceiptManager} receiptManager
   * @param {Transaction} tx
   * @param {Buffer} timestamp
   * @param {Account} constractAccount
   * @param {Array} newCrossPayRequests
   */
  async crossPay(stateManager, receiptManager, tx, timestamp, constractAccount, newCrossPayRequests)
  {
    assert(stateManager instanceof StateManager, `SideChainConstract crossPay, stateManager should be an instance of StateManager, now is ${typeof stateManager}`);
    assert(receiptManager instanceof ReceiptManager, `SideChainConstract crossPay, receiptManager should be an instance of ReceiptManager, now is ${typeof receiptManager}`);
    assert(tx instanceof Transaction, `SideChainConstract crossPay, tx should be an instance of Transaction, now is ${typeof tx}`);
    assert(Buffer.isBuffer(timestamp), `SideChainConstract crossPay, timestamp should an Buffer, now is ${typeof timestamp}`);
    assert(constractAccount instanceof Account, `SideChainConstract crossPay, constractAccount should be an instance of Account, now is ${typeof constractAccount}`);
    assert(Array.isArray(newCrossPayRequests), `SideChainConstract crossPay, newCrossPayRequests should be an Array, now is ${typeof newCrossPayRequests}`);


    for (let i = 0; i < newCrossPayRequests.length; i += 4)
    {
      const spvTxHash = newCrossPayRequests[i];
      const spvTxNumber = newCrossPayRequests[i + 1];
      const spvTxTo = newCrossPayRequests[i + 2];
      const spvTxValue = newCrossPayRequests[i + 3];

      // find correspond tx hash
      const index = this.crossPayRequestsArray.findIndex(el => {
        if (Buffer.isBuffer(el) && el.toString("hex") === spvTxHash.toString('hex')) {
          return true;
        }
        return false;
      });
      
      if (index >= 0)
      {
        // sponsor of spv request
        const spvSponsors = this.crossPayRequestsArray[index + 4];

        // check if spv sponsor is repeated
        if (undefined === spvSponsors.find(el => {
          return el.toString('hex') === tx.from.toString('hex')
        }))
        {
          // add sponsor
          spvSponsors.push(tx.from);

          // record event
          const corssPayRequestEvent = new CorssPayRequestEvent({
            id: this.id,
            code: this.code,
            timestamp: timestamp,
            txHash: spvTxHash,
            number: spvTxNumber,
            to: spvTxTo,
            value: spvTxValue,
            sponsor: tx.from
          });
          await receiptManager.putReceipt(corssPayRequestEvent.hash(), corssPayRequestEvent.serialize())
        }
      }
      else
      {
        this.crossPayRequestsArray.push(spvTxHash);
        this.crossPayRequestsArray.push(timestamp)
        this.crossPayRequestsArray.push(spvTxTo);
        this.crossPayRequestsArray.push(spvTxValue);
        this.crossPayRequestsArray.push([tx.from]);

        // record event
        const corssPayRequestEvent = new CorssPayRequestEvent({
          id: this.id,
          code: this.code,
          timestamp: timestamp,
          txHash: spvTxHash,
          number: spvTxNumber,
          to: spvTxTo,
          value: spvTxValue,
          sponsor: tx.from
        });
        await receiptManager.putReceipt(corssPayRequestEvent.hash(), corssPayRequestEvent.serialize())
      }
    }

    // check reached threshold spv and timestamp
    const nowBN = new BN(timestamp)
    let tmpCrossPayRequestsArray = [];
    for (let i = 0; i < this.crossPayRequestsArray.length; i += 5)
    {
      const hash = this.crossPayRequestsArray[i];
      const payRequestTimestamp = this.crossPayRequestsArray[i + 1];
      const to = this.crossPayRequestsArray[i + 2];
      const value = this.crossPayRequestsArray[i + 3];
      const sponsors = this.crossPayRequestsArray[i + 4];
      if(sponsors.length / this.authorityAddressesArray.length >= bufferToInt(this.threshold) / 100)
      {
        // check balance, transfer token to main block do not need sub guarantee
        if (this.code.toString("hex") !== mainChainCode && new BN(constractAccount.balance).lt(new BN(value)))
        {
          break;
        }

        // get to account
        const toAccount = await stateManager.cache.getOrLoad(to);

        // update toAccount balance
        toAccount.balance = new BN(toAccount.balance).add(new BN(value)).toBuffer();

        // update constract balance (transfer token to main block do not need sub guarantee token)
        if (this.code.toString("hex") !== mainChainCode)
        {
          constractAccount.balance = new BN(constractAccount.balance).sub(new BN(value)).toBuffer();
        }

        await stateManager.putAccount(to, toAccount.serialize());

        // record event
        const corssPayEvent = new CorssPayEvent({
          id: this.id,
          code: this.code,
          timestamp: timestamp,
          txHash: hash,
          to: to,
          value: value
        });
        await receiptManager.putReceipt(corssPayEvent.hash(), corssPayEvent.serialize())
      }
      else if (new BN(payRequestTimestamp).addn(SIDE_CHAIN_PAY_MAX_INTERVAL).lt(nowBN))
      {
        // cross chain pay request has expired
        continue;
      }
      else
      {
        tmpCrossPayRequestsArray.push(this.crossPayRequestsArray[i], 
          this.crossPayRequestsArray[i + 1], 
          this.crossPayRequestsArray[i + 2], 
          this.crossPayRequestsArray[i + 3], 
          this.crossPayRequestsArray[i + 4]);
      }
    }

    this.crossPayRequests = this.encodeArray(tmpCrossPayRequestsArray);
  }

  /**
   * @param {ReceiptManager} receiptManager
   * @param {Transaction} tx
   */
  async appendGuarantee(receiptManager, tx)
  {
    assert(receiptManager instanceof ReceiptManager, `SideChainConstract appendGuarantee, receiptManager should be an instance of ReceiptManager, now is ${typeof receiptManager}`);
    assert(tx instanceof Transaction, `SideChainConstract appendGuarantee, tx should be an instance of Transaction, now is ${typeof tx}`);

    const appendGuaranteeEvent = new AppendGuaranteeEvent({
      id: this.id,
      code: this.code,
      txHash: tx.hash()
    })

    await receiptManager.putReceipt(appendGuaranteeEvent.hash(), appendGuaranteeEvent.serialize())
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