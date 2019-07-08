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
        return this._unl;
    }

    /**
     * @param {String} address
     */
    async setNodeOffLine(address)
    {
        assert(typeof address === 'string', `UnlManager setNodeOffLine, address should be a String, now is ${typeof address}`)

        await this.unlDb.updateUnl(address, 1);

        for(node of this._unl)
        {
            if(node.address === address)
            {
                node.state = 1
                break;
            }
        }
    }

    /**
     * @param {String} address
     */
    async setNodeOnLine(address)
    {
        assert(typeof address === 'string', `UnlManager setNodeOnLine, address should be a String, now is ${typeof address}`)

        await this.unlDb.updateUnl(address, 0);

        for(node of this._unl)
        {
            if(node.address === address)
            {
                node.state = 0
                break;
            }
        }
    }

    /**
     * @param {String} address
     */
    async setNodeMalicious(address)
    {
        assert(typeof address === 'string', `UnlManager setNodeMalicious, address should be a String, now is ${typeof address}`)

        await this.unlDb.updateUnl(address, 2);

        for(node of this._unl)
        {
            if(node.address === address)
            {
                node.state = 2
                break;
            }
        }
    }

    /**
     * @param {String} address
     */
    async setNodeRighteous(address)
    {
        assert(typeof address === 'string', `UnlManager setNodeRighteous, address should be a String, now is ${typeof address}`)

        await this.unlDb.updateUnl(address, 0);

        for(node of this._unl)
        {
            if(node.address === address)
            {
                node.state = 0
                break;
            }
        }
    }
}


module.exports = UnlManager;