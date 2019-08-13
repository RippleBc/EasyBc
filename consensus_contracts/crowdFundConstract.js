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

const COMMAND_FUND = 100;
const COMMAND_REFUND = 101;
const COMMAND_RECEIVE = 102;

class CrowdFundConstract extends Constract
{
  constructor(data)
  {
    super(CrowdFundConstract.id);

    data = data || {};

    let fields = [{
      length: 32,
      name: "id",
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      length: 32,
      name: "state",
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      length: 32,
      name: "beginTime",
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      length: 32,
      name: "endTime",
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      length: 20,
      name: "receiveAddress",
      default: Buffer.alloc(20)
    }, {
      length: 32,
      name: "target",
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      length: 32,
      name: "limit",
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      length: 6000,
      name: "fundInfo",
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }];

    utils.defineProperties(this, fields, data);

    /**
     * @property {Buffer} fundMap (read only).
     * @memberof Transaction
     */
    Object.defineProperty(this, "fundMap", {
      enumerable: false,
      configurable: true,
      get: function () {
        if (!this._fundMap) {
          this._fundMap = this.fundInfo.length > 0 ? new Map(rlp.decode(this.fundInfo).map(entry => {
            return [entry[0].toString(), entry[1]]
          })) : new Map();
        }
        
        return this._fundMap;
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
  async commandHandler(timestamp, stateManager, tx, fromAccount, toAccount)
  {
    assert(Buffer.isBuffer(timestamp), `CrowdFundConstract run, timestamp should be an Buffer, now is ${typeof timestamp}`);
    assert(stateManager instanceof StageManager, `CrowdFundConstract run, stateManager should be an instance of StageManager, now is ${typeof stateManager}`);
    assert(tx instanceof Transaction, `CrowdFundConstract run, tx should be an instance of Transaction, now is ${typeof tx}`);
    assert(fromAccount instanceof Account, `CrowdFundConstract run, fromAccount should be an instance of Account, now is ${typeof fromAccount}`);
    assert(toAccount instanceof Account, `CrowdFundConstract run, toAccount should be an instance of Account, now is ${typeof toAccount}`);

    const commands = rlp.decode(tx.data);

    const beginTimeBn = new BN(this.beginTime);
    const endTimeBn = new BN(this.endTime);

    switch (bufferToInt(commands[0])) {
      case COMMAND_FUND:
        {
          // check timestamp
          if (new BN(beginTimeBn).gt(new BN(timestamp)) || new BN(endTimeBn).lt(new BN(timestamp))) {
            throw new Error(`CrowdFundConstract commandHandler, contract has expired`)
          }

          this.fund(tx.from, tx.value);
        }
        break;

      case COMMAND_REFUND:
        {
          if (new BN(endTimeBn).gt(new BN(timestamp))) {
            throw new Error(`CrowdFundConstract commandHandler, constract has not end, can not refund`)
          }

          this.refund(tx.from, fromAccount, toAccount);
        }
        break;

      case COMMAND_RECEIVE:
        {
          if (new BN(endTimeBn).gt(new BN(timestamp))) {
            throw new Error(`CrowdFundConstract commandHandler, constract has not end, can not receive`)
          }

          await this.receive(stateManager, toAccount);
        }
        break;
      default:
        {
          await Promise.reject(`CrowdFundConstract commandHandler, invaid command, ${parseInt(commands[0])}`)
        }
    }
  }

  /**
   * @param {Buffer} beginTime
   * @param {Buffer} endTime
   * @param {Buffer} receiveAddress
   * @param {Buffer} target
   * @param {Buffer} limit
   */
  create(beginTime, endTime, receiveAddress, target, limit)
  {
    assert(Buffer.isBuffer(beginTime), `CrowdFundConstract create, beginTime should be an Buffer, now is ${typeof beginTime}`);
    assert(Buffer.isBuffer(endTime), `CrowdFundConstract create, endTime should be an Buffer, now is ${typeof endTime}`);
    assert(Buffer.isBuffer(receiveAddress), `CrowdFundConstract create, receiveAddress should be an Buffer, now is ${typeof receiveAddress}`);
    assert(Buffer.isBuffer(target), `CrowdFundConstract create, target should be an Buffer, now is ${typeof target}`);
    assert(Buffer.isBuffer(limit), `CrowdFundConstract create, limit should be an Buffer, now is ${typeof limit}`);

    // check fundTarget
    if (target.length <= 0)
    {
      throw new Error('CrowdFundConstract create, invalid target');
    }

    if (limit.length <= 0)
    {
      throw new Error('CrowdFundConstract create, invalid limit');
    }

    this.beginTime = beginTime;
    this.endTime = endTime;
    this.receiveAddress = receiveAddress;
    this.target = target;
    this.limit = limit;
  }

  /**
   * @param {Buffer} from 
   * @param {Buffer} value
   */
  fund(from, value)
  {
    assert(Buffer.isBuffer(from), `CrowdFundConstract fund, from should be an Buffer, now is ${typeof from}`);
    assert(Buffer.isBuffer(value), `CrowdFundConstract fund, value should be an Buffer, now is ${typeof value}`);

    // check limit
    if (new BN(this.limit).gt(new BN(value)))
    {
      throw new Error(`CrowdFundConstract fund, value should not little than 0x${this.limit.toString("hex")}, now is 0x${value.toString("hex")}`)
    }

    if (this.fundMap.has(from.toString("hex")))
    {
      const originValue = this.fundMap.get(from.toString("hex"));

      this.fundMap.set(from.toString("hex"), new BN(originValue).add(new BN(value)).toBuffer())
    }
    else
    {
      this.fundMap.set(from.toString("hex"), value)
    }

    // update fundInfo
    this.fundInfo = this.encodeMap(this.fundMap)
  }

  /**
   * @param {Buffer} fromAddress
   * @param {Account} fromAccount
   * @param {Buffer} toAccount
   */
  refund(fromAddress, fromAccount, toAccount)
  {
    assert(Buffer.isBuffer(fromAddress), `CrowdFundConstract refund, fromAddress should be an Buffer, now is ${typeof fromAddress}`);
    assert(fromAccount instanceof Account, `CrowdFundConstract refund, fromAccount should be an instance of Account, now is ${typeof fromAccount}`);
    assert(toAccount instanceof Account, `CrowdFundConstract refund, toAccount should be an instance of Account, now is ${typeof toAccount}`);

    if (new BN(toAccount.balance).gte(new BN(this.target)))
    {
      throw new Error(`CrowdFundConstract refund, target has reached, can not refund`);
    }

    // check if has fund
    if (this.fundMap.has(fromAddress.toString("hex"))) {

      // get fund
      const fundValue = this.fundMap.get(fromAddress.toString("hex"));

      // refund, add
      fromAccount.balance = new BN(fromAccount.balance).add(new BN(fundValue)).toBuffer();

      // sub
      toAccount.balance = new BN(toAccount.balance).sub(new BN(fundValue)).toBuffer();

      // delete
      this.fundMap.delete(fromAddress.toString("hex"))


      // update fundInfo
      this.fundInfo = this.encodeMap(this.fundMap)
    }
  }

  /**
   * @param {stateManager} stateManager
   * @param {Account} toAccount
   */
  async receive(stateManager, toAccount)
  {
    assert(stateManager instanceof StageManager, `CrowdFundConstract receive, stateManager should be an instance of StageManager, now is ${typeof stateManager}`);
    assert(toAccount instanceof Account, `CrowdFundConstract receive, toAccount should be an instance of Account, now is ${typeof toAccount}`);

    if (new BN(toAccount.balance).lt(new BN(this.target))) {
      throw new Error(`CrowdFundConstract receive, target has not reached, can not receive`);
    }

    // get receive account
    const receiveAccount = await stateManager.cache.getOrLoad(this.receiveAddress);

    // update receiveAccount
    receiveAccount.balance = new BN(receiveAccount.balance).add(new BN(toAccount.balance)).toBuffer();
    await stateManager.putAccount(this.receiveAddress, receiveAccount.serialize());

    // detroy contract
    this.state = STATE_DESTROYED;

    // reset balance
    toAccount.balance = 0;
  }
}

CrowdFundConstract.id = "01";

module.exports = CrowdFundConstract;