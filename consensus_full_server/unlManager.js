const assert = require("assert")

const mongo = process[Symbol.for("mongo")];

class UnlManager
{
    constructor()
    {
        this._unl = [];
        this.unlDb = mongo.generateUnlDb()
    }

    async init()
    {
        this._unl = await this.unlDb.getUnl();
    }

    get fullUnl()
    {
        return this._unl.filter(node => node.state !== 2);
    }

    get unl()
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

        await this.updateNodes({
            nodes: nodes,
            firstUpdateMemory: true
        });
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

        await this.updateNodes({
            nodes: nodes,
            firstUpdateMemory: true
        });
    }

    /**
     * @param {Array/String} addresses
     */
    async setNodesMalicious(addresses)
    {
        assert(Array.isArray(addresses), `UnlManager setNodesMalicious, addresses should be an Array, now is ${typeof addresses}`)

        const nodes = addresses.map(address => {
            return {
                address: address,
                state: 2
            }
        });

        await this.updateNodes({
            nodes: nodes
        });
    }

    /**
     * @param {Array/String} addresses
     */
    async setNodesRighteous(addresses)
    {
        assert(Array.isArray(addresses), `UnlManager setNodesRighteous, addresses should be an Array, now is ${typeof addresses}`)

        const nodes = addresses.map(address => {
            return {
                address: address,
                state: 0
            }
        });

        await this.updateNodes({
            nodes: nodes
        });
    }

    /**
	 * @param {Array} nodes 
	 */
    async addNodes(nodes)
    {
        assert(Array.isArray(nodes), `UnlManager addNodes, nodes should be an Array, now is ${typeof nodes}`);

        await this.unlDb.addNodes(nodes);

        for(let node of nodes)
        {
            assert(typeof node.host === 'string', `UnlManager addNodes, node.host should be a String, now is ${typeof node.host}`);
            assert(typeof node.queryPort === 'number', `UnlManager addNodes, node.queryPort should be a Number, now is ${typeof node.queryPort}`);
            assert(typeof node.p2pPort === 'number', `UnlManager addNodes, node.p2pPort should be a Number, now is ${typeof node.p2pPort}`);
            assert(typeof node.address === 'string', `UnlManager addNodes, node.address should be a String, now is ${typeof node.address}`);
            
            // check if node has exist
            if(this._unl.find(_node => _node.address === node.address))
            {
                return;
            }

            // update unl in memory
            this._unl.push({
                host: node.host,
                queryPort: node.queryPort,
                p2pPort: node.p2pPort,
                address: node.address,
                state: 1
            })
        }
    }

    /**
	 * @param {Array} nodes 
	 */
    async updateNodes({nodes, firstUpdateMemory = false}) {
        assert(Array.isArray(nodes), `UnlManager addNodes, nodes should be an Array, now is ${typeof nodes}`);

        if(firstUpdateMemory)
        {
            for (let node of nodes) {
                const existNode = this._unl.find(_node => _node.address === node.address)

                if (existNode) {
                    // update unl in memory
                    if (node.host) {
                        assert(typeof node.host === 'string', `UnlManager addNodes, node.host should be a String, now is ${typeof node.host}`);

                        existNode.host = node.host;
                    }

                    if (node.queryPort) {
                        assert(typeof node.queryPort === 'number', `UnlManager addNodes, node.queryPort should be a Number, now is ${typeof node.queryPort}`);

                        existNode.queryPort = node.queryPort;
                    }

                    if (node.p2pPort) {
                        assert(typeof node.p2pPort === 'number', `UnlManager addNodes, node.p2pPort should be a Number, now is ${typeof node.p2pPort}`);

                        existNode.p2pPort = node.p2pPort;
                    }

                    if (node.address) {
                        assert(typeof node.address === 'string', `UnlManager addNodes, node.address should be a String, now is ${typeof node.address}`);

                        existNode.address = node.address;
                    }

                    if (node.state) {
                        assert(typeof node.state === 'number', `UnlManager addNodes, node.state should be a Number, now is ${typeof node.state}`);

                        existNode.state = node.state;
                    }
                }
            }
        }

        await this.unlDb.updateNodes(nodes);

        if(!firstUpdateMemory)
        {
            for (let node of nodes) 
            {
                const existNode = this._unl.find(_node => _node.address === node.address)

                if (existNode) 
                {
                    // update unl in memory
                    if (node.host) {
                        assert(typeof node.host === 'string', `UnlManager addNodes, node.host should be a String, now is ${typeof node.host}`);

                        existNode.host = node.host;
                    }

                    if (node.queryPort) {
                        assert(typeof node.queryPort === 'number', `UnlManager addNodes, node.queryPort should be a Number, now is ${typeof node.queryPort}`);

                        existNode.queryPort = node.queryPort;
                    }

                    if (node.p2pPort) {
                        assert(typeof node.p2pPort === 'number', `UnlManager addNodes, node.p2pPort should be a Number, now is ${typeof node.p2pPort}`);

                        existNode.p2pPort = node.p2pPort;
                    }

                    if (node.address) {
                        assert(typeof node.address === 'string', `UnlManager addNodes, node.address should be a String, now is ${typeof node.address}`);

                        existNode.address = node.address;
                    }

                    if (node.state) {
                        assert(typeof node.state === 'number', `UnlManager addNodes, node.state should be a Number, now is ${typeof node.state}`);

                        existNode.state = node.state;
                    }
                }
            }
        }
    }

    /**
	 * @param {Array} nodes 
	 */
    async deleteNodes(nodes) {
        assert(Array.isArray(nodes), `UnlManager deleteNodes, nodes should be an Array, now is ${typeof nodes}`);

        await this.unlDb.deleteNodes(nodes);

        for (let node of nodes) {
            assert(typeof node.address === 'string', `UnlManager deleteNodes, node.address should be a String, now is ${typeof node.address}`);

            // check if node has exist
            const index = this._unl.findIndex(_node => _node.address === node.address)
            if (index < 0) {
                return;
            }

            // update unl in memory
            this._unl.splice(index, 1)
        }
    }
}


module.exports = UnlManager;