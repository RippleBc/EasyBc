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
      'address host queryPort p2pPort state', 
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
   */
  async addNodes(nodes)
  {
    assert(Array.isArray(nodes), `UnlManager addNodes, nodes should be a String, now is ${typeof nodes}`)

    
  }

  /**
   * @param {Array} addresses
   */
  async updateNodes(nodes)
  {
    assert(Array.isArray(nodes), `UnlManager updateNodes, nodes should be a String, now is ${typeof nodes}`)

    const updateTasks = []

    for(let node of nodes)
    {
      assert(typeof node.address === 'string', `UnlManager updateNodes node.address should be a String, now is ${typeof node.address}`);

      const updateField = {}
      if(node.host)
      {
        updateField.host = node.host
      }
      if (node.queryPort) {
        updateField.queryPort = node.queryPort
      }
      if (node.p2pPort) {
        updateField.p2pPort = node.p2pPort
      }
      if (node.state) {
        updateField.state = node.state
      }

      const promise = new Promise((resolve, reject) => {
        this.Unl.update({
          address: node.address
        }, updateField, err => {
            if (!!err) {
              reject(`UnlManager updateNodes, updateOne failed, address: ${address}`)
            }

            resolve();
          })
      })

      updateTasks.push(promise)
    }
    
    
    return Promise.all(updateTasks)
  }

  /**
   * @param {Array} addresses
   */
  async deleteNodes(nodes)
  {
    assert(Array.isArray(nodes), `UnlManager deleteNodes, nodes should be a String, now is ${typeof nodes}`)

    const promise = new Promise((resolve, reject) => {
      this.Unl.deleteMany({
        address: {
          $in: nodes.map(node => node.address)
        }
      }, err => {
        if (!!err) {
          reject(`UnlManager updateNodes, updateOne failed, address: ${address}`)
        }

        resolve();
      })
    })

    return promise;
  }
}

module.exports = UnlDb;