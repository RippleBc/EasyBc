const assert = require("assert");
const Account = require("../depends/account");
const utils = require("../depends/utils");
const StageManager = require("../depends/block_chain/stateManager");
const Transaction = require("../depends/transaction");
const { STATE_DESTROYED } = require("./constant");
const Contract = require("./contract");

const rlp = utils.rlp;
const BN = utils.BN;

const COMMAND_FUND = 1;
const COMMAND_REFUND = 2;
const COMMAND_RECEIVE = 3;

class CrowdFundContract extends Contract
{
  constructor(data)
  {
    super(CrowdFundContract.id);

    data = data || {};

    let fields = [{
      length: 32,
      name: "id",
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      length: 32,
      name: "state",
      allowZero: true,
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
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      length: 32,
      name: "limit",
      allowZero: true,
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
        if (this.fundMap) {
          return this.fundMap;
        }
        
        this.fundMap = new Map(rlp.decode(this.fundInfo));
      }
    });
  }

  /**
   * @param {StageManager} stateManager
   * @param {Transaction} tx
   * @param {Account} fromAccount
   * @param {Account} toAccount
   */
  async commandHandler(stateManager, tx, fromAccount, toAccount)
  {
    assert(stateManager instanceof StageManager, `CrowdFundContract run, stateManager should be an instance of StageManager, now is ${typeof stateManager}`);
    assert(tx instanceof Transaction, `CrowdFundContract run, tx should be an instance of Transaction, now is ${typeof tx}`);
    assert(fromAccount instanceof Account, `CrowdFundContract run, fromAccount should be an instance of Account, now is ${typeof fromAccount}`);
    assert(toAccount instanceof Account, `CrowdFundContract run, toAccount should be an instance of Account, now is ${typeof toAccount}`);

    // check timestamp
    const beginTimeBn = new BN(this.beginTime);
    const endTimeBn = new BN(this.endTime);
    const now = Date.now();
    if(new BN(beginTimeBn).gtn(now) || new BN(endTimeBn).ltn(now))
    {
      throw new Error(`CrowdFundContract, contract has expired`)
    }

    switch (commands[0]) {
      case COMMAND_FUND:
        {
          this.fund(tx.from, tx.value);
        }
        break;

      case COMMAND_REFUND:
        {
          this.refund(fromAccount, tx.value);
        }
        break;

      case COMMAND_RECEIVE:
        {
          await this.receive(stateManager, tx.to);
        }
        break;
    }
  }

  /**
   * @param {Buffer} beginTime
   * @param {Buffer} endTime
   * @param {Buffer} receiveAddress
   * @param {Buffer} target
   * @param {Buffer} limit
   */
  create({ beginTime, endTime, receiveAddress, target, limit })
  {
    assert(Buffer.isBuffer(beginTime), `CrowdFundContract create, beginTime should be an Buffer, now is ${typeof beginTime}`);
    assert(Buffer.isBuffer(endTime), `CrowdFundContract create, endTime should be an Buffer, now is ${typeof endTime}`);
    assert(Buffer.isBuffer(receiveAddress), `CrowdFundContract create, receiveAddress should be an Buffer, now is ${typeof receiveAddress}`);
    assert(Buffer.isBuffer(target), `CrowdFundContract create, target should be an Buffer, now is ${typeof target}`);
    assert(Buffer.isBuffer(limit), `CrowdFundContract create, limit should be an Buffer, now is ${typeof limit}`);

    // check fundTarget
    if (target.length <= 0)
    {
      throw new Error('CrowdFundContract create, invalid target');
    }

    if (limit.length <= 0)
    {
      throw new Error('CrowdFundContract create, invalid limit');
    }

    this.beginTime = beginTime;
    this.endTime = endTime;
    this.receiveMoney = receiveAddress;
    this.target = target;
    this.limit = limit;
  }

  /**
   * @param {Buffer} from 
   * @param {Buffer} value
   */
  fund(from, value)
  {
    assert(Buffer.isBuffer(from), `CrowdFundContract fund, from should be an Buffer, now is ${typeof from}`);
    assert(Buffer.isBuffer(value), `CrowdFundContract fund, value should be an Buffer, now is ${typeof value}`);

    // check limit
    if (new BN(this.limit).gt(new BN(value)))
    {
      throw new Error(`CrowdFundContract fund, value should not little than 0x${this.limit.toString("hex")}, now is 0x${value.toString("hex")}`)
    }

    if (this.fundMap.has(from))
    {
      const originValue = this.fundMap.get(from);

      this.fundMap.set(from, new BN(originValue).add(new BN(value)).toBuffer())
    }
    else
    {
      this.fundMap.set(from, value)
    }
  }

  /**
   * @param {Account} fromAccount
   * @param {Buffer} fromAddress
   */
  refund(fromAddress, fromAccount)
  {
    assert(fromAccount instanceof Account, `CrowdFundContract refund, fromAccount should be an instance of Account, now is ${typeof fromAccount}`);
    assert(Buffer.isBuffer(fromAddress), `CrowdFundContract refund, fromAddress should be an Buffer, now is ${typeof fromAddress}`);
    
    if (this.fundMap.has(fromAddress)) {
      const fundValue = this.fundMap.get(fromAddress);

      fromAccount.balance = new BN(fromAccount.balance).add(new BN(fundValue)).toBuffer();
    }
  }

  /**
   * @param {stateManager} stateManager
   * @param {Buffer} contractAddress
   */
  async receive(stateManager, contractAddress)
  {
    assert(stateManager instanceof StageManager, `ContractsManager receive, stateManager should be an instance of StageManager, now is ${typeof stateManager}`);
    assert(Buffer.isBuffer(contractAddress), `ContractsManager receive, contractAddress should be an Buffer, now is ${typeof contractAddress}`);

    const receiveAccount = await stateManager.cache.get(this.receiveAddress);
    const contractAccount = await stateManager.cache.get(contractAddress);

    // update receiveAccount
    receiveAccount.balance = new BN(receiveAccount.balance).add(new BN(contractAccount.balance)).toBuffer();

    // detroy contract
    contractAccount.state = STATE_DESTROYED;
    contractAccount.balance = 0;
  }
}

CrowdFundContract.id = "01";

module.exports = CrowdFundContract;