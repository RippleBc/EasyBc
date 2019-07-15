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

        let needUpdateNodes = [];

        for(let node of this._unl)
        {
            for(let address of addresses)
            {
                if(node.address === address && node.state !== 1)
                {
                    needUpdateNodes.push(address)

                    node.state = 1

                    break;
                }
            }
        }

        if(needUpdateNodes.length > 0)
        {
            await this.unlDb.updateUnl(needUpdateNodes, 1);
        }
    }

    /**
     * @param {Array/String} addresses
     */
    async setNodesOnline(addresses)
    {
        assert(Array.isArray(addresses), `UnlManager setNodesOnline, addresses should be a String, now is ${typeof addresses}`)

        let needUpdateNodes = [];

        for(let node of this._unl)
        {
            for(let address of addresses)
            {
                if(node.address === address && node.state !== 0)
                {
                    needUpdateNodes.push(address)

                    node.state = 0

                    break;
                }
            }
            
        }

        if(needUpdateNodes.length > 0)
        {
            await this.unlDb.updateUnl(needUpdateNodes, 0);
        }
    }

    /**
     * @param {Array/String} addresses
     */
    async setNodesMalicious(addresses)
    {
        assert(Array.isArray(addresses), `UnlManager setNodesMalicious, addresses should be an Array, now is ${typeof addresses}`)

        await this.unlDb.updateUnl(addresses, 2);

        for(let node of this._unl)
        {
            for(let address of addresses)
            {
                if(node.address === address)
                {
                    node.state = 2
                    break;
                }
            }
            
        }
    }

    /**
     * @param {Array/String} addresses
     */
    async setNodesRighteous(addresses)
    {
        assert(Array.isArray(addresses), `UnlManager setNodesRighteous, addresses should be an Array, now is ${typeof addresses}`)

        await this.unlDb.updateUnl(addresses, 0);

        for(let node of this._unl)
        {
            for(let address of addresses)
            {
                if(node.address === address)
                {
                    node.state = 0
                    break;
                }
            }
            
        }
    }
}


module.exports = UnlManager;