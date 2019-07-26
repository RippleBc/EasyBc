const assert = require("assert");
const Account = require("../depends/account");
const utils = require("../depends/utils");

const rlp = utils.rlp;
const BN = utils.BN;

class CrowdFund
{
  static ip = "01";

  constructor(data)
  {
    data = data || {};

    let fields = [{
      length: 32,
      name: "id",
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
      length: 32,
      name: "receiveAddress",
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      length: 256,
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
   * @param {Account} fromAccount
   * @param {Account} toAccount
   * @param {Array} command
   * @param {Buffer} value
   */
  run(fromAccount, toAccount, command, value)
  {
    assert(fromAccount instanceof Account, `CrowdFund runContract, fromAccount should be an instance of Account, now is ${typeof fromAccount}`);
    assert(toAccount instanceof Account, `CrowdFund runContract, toAccount should be an instance of Account, now is ${typeof toAccount}`);
    assert(Array.isArray(command), `CrowdFund runContract, command should be an Array, now is ${typeof command}`);
    assert(Buffer.isBuffer(value), `CrowdFund runContract, value should be an Buffer, now is ${typeof value}`);
  }

  /**
   * @param {Buffer} address 
   * @param {Buffer} value
   */
  fund(address, value)
  {
    assert(Buffer.isBuffer(address), `CrowdFund fund, address should be an Buffer, now is ${typeof address}`);
    assert(Buffer.isBuffer(value), `CrowdFund fund, value should be an Buffer, now is ${typeof value}`);

    if (this.fundMap.has(address))
    {
      const originValue = this.fundMap.get(address);
      this.fundMap.set(address, new BN(originValue).add(new BN(value)).toBuffer())
    }
    else
    {
      this.fundMap.set(address, value)
    }
  }

  /**
   * @param {Account} fromAccount
   */
  refund(fromAccount)
  {
    assert(fromAccount instanceof Account, `CrowdFund refund, fromAccount should be an instance of Account, now is ${typeof fromAccount}`);

    if (this.fundMap.has(fromAccount.address)) {
      const fundValue = this.fundMap.get(fromAccount.address);

      fromAccount.balance = new BN(fromAccount.balance).add(new BN(fundValue));
    }
  }

  /**
   * @param {param} 
   */
  receiveMoney()
  {
    
  }
}