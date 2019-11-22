const switchConfig = require("./switchConfig");
const switchPort = require("./switchPort");

module.exports = async (options) => {

    switchConfig(options);

    await switchPort(options.proxy);

    process.exit(1);
}