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

    get unl() 
    {
        return this._unl.filter(node => {
            return node.state === 0
        });
    }

    /**
     * @param {Array} addresses
     */
    async setNodeOffLine(addresses)
    {
        assert(Array.isArray(addresses), `UnlManager setNodeOffLine, addresses should be an Array, now is ${typeof addresses}`)

        await this.unlDb.updateUnl(addresses, 1);

        for(let node of this._unl)
        {
            for(let address of addresses)
            {
                if(node.address === address)
                {
                    node.state = 1
                    break;
                }
            }
            
        }
    }

    /**
     * @param {Array} addresses
     */
    async setNodeOnLine(addresses)
    {
        assert(Array.isArray(addresses), `UnlManager setNodeOnLine, addresses should be a String, now is ${typeof addresses}`)

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

    /**
     * @param {Array} addresses
     */
    async setNodeMalicious(addresses)
    {
        assert(Array.isArray(addresses), `UnlManager setNodeMalicious, addresses should be an Array, now is ${typeof addresses}`)

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
     * @param {Array} addresses
     */
    async setNodeRighteous(addresses)
    {
        assert(Array.isArray(addresses), `UnlManager setNodeRighteous, addresses should be an Array, now is ${typeof addresses}`)

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