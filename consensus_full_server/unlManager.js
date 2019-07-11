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
        return this._unl;
    }

    get unl() 
    {
        return this._unl.filter(node => {
            return node.state === 0
        });
    }

    /**
     * @param {Array/String} addresses
     */
    async setNodesOffline(addresses)
    {
        assert(Array.isArray(addresses), `UnlManager setNodesOffline, addresses should be an Array, now is ${typeof addresses}`)

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

        await this.unlDb.updateUnl(addresses, 1);
    }

    /**
     * @param {Array/String} addresses
     */
    async setNodesOnline(addresses)
    {
        assert(Array.isArray(addresses), `UnlManager setNodesOnline, addresses should be a String, now is ${typeof addresses}`)

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

        await this.unlDb.updateUnl(addresses, 0);
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