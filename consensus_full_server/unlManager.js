const assert = require("assert")
const { index: processIndex } = require("../globalConfig.json")

const mongo = process[Symbol.for("mongo")];

class UnlManager
{
    constructor()
    {
        this._unl = [];
        this.unlDb = mongo.generateUnlDb()
    }

    async flushUnlToMemory()
    {
        this._unl = await this.unlDb.getUnl();
    }

    get unlIncludeSelf()
    {
        return [...this._unl.filter(node => node.state !== 2), {
            address: process[Symbol.for("address")],
            host: "",
            queryPort: 0,
            p2pPort: 0,
            state: 0,
            index: processIndex
        }];
    }

    get unlNotIncludeSelf()
    {
        return this._unl.filter(node => node.state !== 2);
    }

    get unlFullSize()
    {
        return this.unlNotIncludeSelf.length + 1;
    }

    get unlOnline()
    {
        return this._unl.filter(node => node.state === 0);
    }

    /**
     * @param {Array/String} addresses
     */
    async setNodesOffline(addresses)
    {
        assert(Array.isArray(addresses), `UnlManager setNodesOffline, addresses should be an Array, now is ${typeof addresses}`)

        const nodes = addresses.map(address => { 
            return { 
                address: address, 
                state: 1 
            }
        });

        await this.updateNodes(nodes);
    }

    /**
     * @param {Array/String} addresses
     */
    async setNodesOnline(addresses)
    {
        assert(Array.isArray(addresses), `UnlManager setNodesOnline, addresses should be a String, now is ${typeof addresses}`)

        const nodes = addresses.map(address => {
            return {
                address: address,
                state: 0
            }
        });

        await this.updateNodes(nodes);
    }

    /**
	 * @param {Array} nodes 
	 */
    async addNodes(nodes)
    {
        assert(Array.isArray(nodes), `UnlManager addNodes, nodes should be an Array, now is ${typeof nodes}`);

        await this.unlDb.addNodes(nodes);
    }

    /**
	 * @param {Array} nodes 
	 */
    async updateNodes(nodes) {
        assert(Array.isArray(nodes), `UnlManager updateNodes, nodes should be an Array, now is ${typeof nodes}`);

        //
        await this.unlDb.updateNodes(nodes);
    }

    /**
	 * @param {Array} nodes 
	 */
    async deleteNodes(nodes) {
        assert(Array.isArray(nodes), `UnlManager deleteNodes, nodes should be an Array, now is ${typeof nodes}`);

        await this.unlDb.deleteNodes(nodes);
    }
}


module.exports = UnlManager;