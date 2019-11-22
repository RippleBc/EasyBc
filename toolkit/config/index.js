const switchConfig = require("./switchConfig");
const switchPort = require("./switchPort");

module.exports = async (mode) => {
    switchConfig(mode);

    await switchPort(mode);

    process.exit(1);
}