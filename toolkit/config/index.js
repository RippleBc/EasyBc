const switchConfig = require("./switchConfig");
const utils = require("../../depends/utils");

const createPrivateKey = utils.createPrivateKey;
const publicToAddress = utils.publicToAddress;
const privateToPublic = utils.privateToPublic;

const generateKeyPiar = function () {
    const privateKey = createPrivateKey();

    const publicKey = privateToPublic(privateKey);
    const address = publicToAddress(publicKey);

    return { privateKey, address }
}

module.exports = async (options) => {
    if (options.generatePrivateKey) {
        const keyPair = generateKeyPiar();
        
        options.privateKey = keyPair.privateKey;

        var address = keyPair.address;
    }

    switchConfig(options);

    await require("./switchPort")(options.p2pProxyOpen);

    if(address)
    {
        console.warn("!!!!!!!!!!!! please record the node address string, it will be use for authentication by other nodes");
        console.warn(`node address: ${address.toString('hex')}`);
    }

    process.exit(1);
}