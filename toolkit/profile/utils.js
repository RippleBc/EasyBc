const assert = require("assert");
const Account = require("../../depends/account");
const Transaction = require("../../depends/transaction");
const utils = require("../../depends/utils");
const { SUCCESS } = require("../../constant");
const { randomBytes } = require("crypto");
const rp = require("request-promise");

const bufferToInt = utils.bufferToInt;
const createPrivateKey = utils.createPrivateKey;
const publicToAddress = utils.publicToAddress;
const privateToPublic = utils.privateToPublic;
const padToEven = utils.padToEven;

/**
 * @param {String} url
 * @param {String} address
 * @return {Account}
 */
module.exports.getAccountInfo = async (url, address) => {
    assert(typeof address === "string", `getAccountInfo, address should be a String, now is ${typeof address}`);
    assert(typeof url === "string", `getAccountInfo, url should be a String, now is ${typeof url}`);

    const options = {
        method: "POST",
        uri: `${url}/getAccountInfo`,
        body: {
            address: address
        },
        json: true
    };

    const { code, data, msg } = await rp(options);

    if (code !== SUCCESS) {
        await Promise.reject(`getAccountInfo, throw exception, ${msg}`)
    }

    let account;
    if (data) {
        account = new Account(Buffer.from(data, "hex"));
    }
    else {
        account = new Account();
    }

    return account;
}

/**
 * @param {String} url
 * @param {String} hash 
 * @return {Number} state
 */
module.exports.checkIfTransactionPacked = async (url, hash) => {
    assert(typeof hash === 'string', `checkIfTransactionPacked, hash should be a String, now is ${typeof hash}`);

    const options = {
        method: "POST",
        uri: `${url}/getTransactionState`,
        body: {
            hash: hash
        },
        json: true
    };

    const { code, data, msg } = await rp(options);

    if (code !== SUCCESS) {
        await Promise.reject(`checkIfTransactionPacked, throw exception, ${msg}`)
    }

    return data;
}

/**
 * @param {String} url
 * @param {String} tx
 */
module.exports.sendTransaction = async (url, tx) => {
    assert(typeof url === "string", `sendTransaction, url should be a String, now is ${typeof url}`);
    assert(typeof tx === "string", `sendTransaction, tx should be a String, now is ${typeof tx}`);

    const options = {
        method: "POST",
        uri: `${url}/sendTransaction`,
        body: {
            tx: tx
        },
        json: true
    };

    const { code, msg } = await rp(options);

    if (code !== SUCCESS) {
        await Promise.reject(`sendTransaction, throw exception, ${url}, ${msg}`)
    }
}

/**
 * @param {String} privateKey
 * @param {String} nonce
 * @param {String} to
 * @param {Buffer} value
 * @return {Object}
 *  - prop {String} tx
 *  - prop {String} hash
 */
module.exports.generateSpecifiedTx = (privateKey, nonce, to, value) => {
    assert(typeof privateKey === 'string', `generateSpecifiedTx, privateKey should be a Hex String, now is ${typeof privateKey}`);
    assert(typeof nonce === 'string', `generateSpecifiedTx, nonce should be a Hex String, now is ${typeof nonce}`);
    assert(typeof to === 'string', `generateSpecifiedTx, to should be a Hex String, now is ${typeof to}`);
    assert(Buffer.isBuffer(value), `generateSpecifiedTx, value should be an Buffer, now is ${typeof value}`);

    // init tx
    const transaction = new Transaction({
        timestamp: Date.now(),
        nonce: Buffer.from(padToEven(nonce), "hex"),
        to: Buffer.from(to, "hex"),
        value: value
    })
    // sign
    transaction.sign(Buffer.from(privateKey, "hex"));

    return {
        hash: transaction.hash().toString('hex'),
        txRaw: transaction.serialize().toString("hex")
    };
}

/**
 * @return {String} transaction raw data
 */
module.exports.generateRandomTx = () => {
    // init from private
    const privateKeyFrom = createPrivateKey();

    // init to Address
    const privateKeyTo = createPrivateKey();
    const publicKeyTo = privateToPublic(privateKeyTo);
    const addressTo = publicToAddress(publicKeyTo);

    // init tx
    const nonce = randomBytes(1) | 0x01;
    const value = randomBytes(1) | 0x01;
    const transaction = new Transaction({
        timestamp: Date.now(),
        nonce: nonce,
        to: addressTo,
        value: value
    });

    // sign
    transaction.sign(privateKeyFrom);

    return transaction.serialize().toString("hex");
}

/**
 * @param {Number} range 
 */
module.exports.getRandomIndex = (range) => {
    assert(typeof range === 'number', `getRandomIndex, range should be a Number, now is ${typeof range}`);

    const random = randomBytes(4);

    return bufferToInt(random) % range;
}