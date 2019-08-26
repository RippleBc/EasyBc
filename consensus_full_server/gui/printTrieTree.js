const mongoDBWraper = require("../../depends/mongo_wrapper");
const Trie = require("../../depends/merkle_patricia_tree");
const utils = require("../../depends/utils");
const Account = require("../../depends/account");
const TrieNode = require("../../depends/merkle_patricia_tree/trieNode")
const { mongo: mongoConfig } = require("../config.json")
const { removeHexPrefix } = require("../../depends/merkle_patricia_tree/util/hex");
const { bufferToNibbles, nibblesToBuffer } = require("../../depends/merkle_patricia_tree/util/nibbles");

const stateRoot = Buffer.from("274a98d0e415de36ee2983e0b6080a62e2f54f0bd21ef863ecdf94b7d1f4ad92", "hex");

function parseTrieNode(trieNode) {
    var out = trieNode.type;
    out += ': [';

    if (trieNode.type === 'extention') {
        out += nibblesToBuffer(removeHexPrefix(bufferToNibbles(trieNode.raw[0]))).toString("hex") + ", " + (Array.isArray(trieNode.raw[1]) ? `TrieNode: ${parseTrieNode(new TrieNode(el))}` : trieNode.raw[1].toString("hex")) + ", ";
    }
    else if (trieNode.type === 'leaf') {
        const account = new Account(trieNode.value);
        out += nibblesToBuffer(removeHexPrefix(bufferToNibbles(trieNode.raw[0]))).toString("hex") + ", " + `nonce=${account.nonce.toString("hex")}&balance=${account.balance.toString("hex")}, `
    }
    else {
        for (let i = 0; i < trieNode.raw.length - 1; i++) {
            const el = trieNode.raw[i];

            if (Buffer.isBuffer(el)) {
                out += (el.length > 0 ? el.toString('hex') : 'empty') + ', '
            }
            else if (el) {
                out += `TrieNode: ${parseTrieNode(new TrieNode(el))}, `;
            }
            else {
                out += 'empty, '
            }
        }

        if (trieNode.value) {
            out += `nonce=${account.nonce.toString("hex")}&balance=${account.balance.toString("hex")}, `
        }
    }

    out = out.slice(0, -2);
    out += ']'
    return out
}

(async () => {
    await mongoDBWraper.initBaseDb(mongoConfig.host, mongoConfig.port, mongoConfig.user, mongoConfig.password, mongoConfig.dbName);

    const mptDb = mongoDBWraper.generateMptDb();
   

        let trie = new Trie(mptDb, stateRoot)

        await new Promise((resolve, reject) => {
            trie._findDbNodes((nodeRef, node, key, next) => {
                console.log(`\nnodeRef: ${nodeRef.toString("hex")}, node: ${parseTrieNode(node)}, key: ${(key.toString("hex"))}\n`);

                next();

            }, () => {
                console.log("\n****************************** end ******************************\n")

                resolve()
            })
        })


    console.log("over")
})()







