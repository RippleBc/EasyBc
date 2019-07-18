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
    assert(Array.isArray(nodes), `UnlDb addNodes, nodes should be a String, now is ${typeof nodes}`)

    nodes = nodes.map(node => {

      assert(typeof node.host === 'string', `UnlDb addNodes, node.host should be a String, now is ${typeof node.host}`);
      assert(typeof node.queryPort === 'number', `UnlDb addNodes, node.queryPort should be a Number, now is ${typeof node.queryPort}`);
      assert(typeof node.p2pPort === 'number', `UnlDb addNodes, node.p2pPort should be a Number, now is ${typeof node.p2pPort}`);
      assert(typeof node.address === 'string', `UnlDb addNodes, node.address should be a String, now is ${typeof node.address}`);

      return {
        address: node.address,
        host: node.host,
        queryPort: node.queryPort,
        p2pPort: node.p2pPort,
        state: 1
      }
    })


    await this.Unl.create(nodes)
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
      if(undefined !== node.host)
      {
        updateField.host = node.host
      }
      if (undefined !== node.queryPort) {
        updateField.queryPort = node.queryPort
      }
      if (undefined !== node.p2pPort) {
        updateField.p2pPort = node.p2pPort
      }
      if (undefined !== node.state) {
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