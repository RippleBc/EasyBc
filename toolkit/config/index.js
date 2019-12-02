const switchConfig = require("./switchConfig");
const switchPort = require("./switchPort");

module.exports = async (options) => {

    switchConfig(options);

    await switchPort(options.p2pProxyOpen);

    process.exit(1);
}