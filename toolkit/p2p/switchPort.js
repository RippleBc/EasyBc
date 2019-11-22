const mongoConfig = require("../../consensus_full_server/config").mongo;

module.exports = async function (mode) {
    // init mongo
    process[Symbol.for("mongo")] = require("../../depends/mongo_wrapper");
    await process[Symbol.for("mongo")].initBaseDb(mongoConfig.host, mongoConfig.port, mongoConfig.user, mongoConfig.password, mongoConfig.dbName);

    // init unl
    const UnlManager = require("../../consensus_full_server/unlManager");
    const unlManager = new UnlManager();
    await unlManager.init( );

    //
    for (let node of unlManager._unl)
    {
        if(mode === 'proxy')
        {
            node.p2pPort -= 2020;
        }
        else
        {
            node.p2pPort += 2020;
        }
    }

    //
    await unlManager.updateNodes({nodes: unlManager._unl});

    //
    for (let node of unlManager._unl) {
        console.info(`address: ${node.address}, host: ${node.host}, queryPort: ${node.queryPort}, p2pPort: ${node.p2pPort}, index: ${node.index}, state: ${node.state}`)
    }
};