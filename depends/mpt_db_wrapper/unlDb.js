const unlSchema = require("./unl")
const assert = require("assert")

class UnlDb
{
  constructor(mongooseInstance)
  {
    this.Unl = mongooseInstance.model('Unl', unlSchema);
  }

  /**
   * @return {Array}
   */
  async getUnl()
  {
    const promise = new Promise((resolve, reject) => {
      this.Unl.find({
        
      }, 
      'address host queryPort p2pPort', 
      { 
        lean: true 
      }, 
      (err, result) => {
        if(!!err)
        {
          reject(new Error(`UnlDb getUnl, throw exception, ${err}`))
        }

        if(result)
        {
          resolve(result)
        }
        else
        {
          resolve([])
        }
      });
    });

    return promise;
  }

  /**
   * @param {Array} addresses
   * @param {Number} state
   */
  async updateUnl(addresses, state)
  {
    assert(Array.isArray(addresses), `UnlManager updateUnl, addresses should be a String, now is ${typeof addresses}`)
    assert(Number.isNumber(state), `UnlManager updateUnl, state should be a Number, now is ${typeof state}`)

    if(state !== 0 && state !== 1 && state !== 2)
    {
        throw new Error(`UnlManager updateUnl, state should be normal, offline or cheated, now is ${state}`)
    }

    const promise = new Promise((resolve, reject) => {
        this.Unl.update({
            address: {
              $in: addresses
            }
        }, {
            state: state
        }, err => {
            if(!!err)
            {
                reject(`UnlManager updateUnl, updateOne failed, address: ${address}`)
            }

            resolve();
        })
    })
    
    return promise;
  }
}

module.exports = UnlDb;