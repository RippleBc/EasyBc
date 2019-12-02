const switchConfig = require("./switchConfig");

module.exports = async (options) => {

    switchConfig(options);

    await require("./switchPort")(options.p2pProxyOpen);

    process.exit(1);
}