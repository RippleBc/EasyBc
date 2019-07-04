const checkCookie = require('../user/checkCookie')
const { SUCCESS, PARAM_ERR, OTH_ERR } = require('../../constant')
const Block = require("../../depends/block");
const rp = require("request-promise");
const assert = require("assert");
const utils = require("../../depends/utils");

const BN = utils.BN;
const Buffer = utils.Buffer;
const padToEven = utils.padToEven;

const app = process[Symbol.for('app')]
const printErrorStack = process[Symbol.for("printErrorStack")]

const BLOCKS_MAX_NUM = 4;

app.get('/blocks', checkCookie, (req, res) => {
	const url = req.query.url;

    assert(typeof url === 'string', `url should be a String, now is ${typeof url}`);

    (async function() {
        const blocks = [];

        const lastestBlockRaw = await getLastestBlock(url);
        const lastestBlock = new Block(Buffer.from(lastestBlockRaw, 'hex'));

        blocks.push({
            hash: lastestBlock.hash().toString('hex'),
            parentHash: lastestBlock.header.parentHash.toString('hex'),
            stateRoot: lastestBlock.header.stateRoot.toString('hex'),
            number: lastestBlock.header.number.toString('hex'),
            timestamp: lastestBlock.header.timestamp.toString('hex')
        });

        let blockChainHeight = new BN(lastestBlock.header.number);
        let index = new BN(lastestBlock.header.number).subn(1);
        let minIndex = blockChainHeight.subn(BLOCKS_MAX_NUM)
       
        while(index.gten(0) && index.gt(minIndex))
        {
            let blockRaw = await getBlockByNumber(url, padToEven(index.toString('hex')));
            let block = new Block(Buffer.from(blockRaw, 'hex'));

            blocks.push({
                hash: block.hash().toString('hex'),
                parentHash: block.header.parentHash.toString('hex'),
                stateRoot: block.header.stateRoot.toString('hex'),
                number: block.header.number.toString('hex'),
                timestamp: block.header.timestamp.toString('hex')
            });

            index.isubn(1);
        }

        blocks.reverse();

        return blocks;
    })().then(blocks => {
        res.json({
            code: SUCCESS,
            data: blocks
        })
    }).catch(e => {
        printErrorStack(e)

        res.json({
            code: OTH_ERR,
            msg: e.toString()
        })
    })
    
});

/**
 * @param {String} url
 * @param {String} number
 */
const getBlockByNumber = async function(url, number)
{
    assert(typeof url === "string", `chat getBlockByNumber, url should be a String, now is ${typeof url}`);
    assert(typeof number === "string", `chat getBlockByNumber, number should be a String, now is ${typeof number}`);

    const options = {
        method: "POST",
        uri: `${url}/getBlockByNumber`,
        body: {
            number: number
        },
        json: true // Automatically stringifies the body to JSON
    };
    
    const promise = new Promise((resolve, reject) => {
        rp(options).then(response => {
            if(response.code !== SUCCESS)
            {
                reject(response.msg);
            }
            resolve(response.data);
        }).catch(e => {
            reject(e.toString());
        });
    });

    return promise;
}

/**
 * @param {String} url
 */
const getLastestBlock = async function(url)
{
    assert(typeof url === "string", `chat getLastestBlock, url should be a String, now is ${typeof url}`);

    const options = {
        method: "POST",
        uri: `${url}/getLastestBlock`,
        body: {
            
        },
        json: true // Automatically stringifies the body to JSON
    };
    
    const promise = new Promise((resolve, reject) => {
        rp(options).then(response => {
            if(response.code !== SUCCESS)
            {
                reject(response.msg);
            }
            resolve(response.data);
        }).catch(e => {
            reject(e.toString());
        });
    });

    return promise;
}