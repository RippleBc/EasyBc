const { SUCCESS, PARAM_ERR, OTH_ERR } = require('../../constant')
const assert = require("assert");
const utils = require("../../depends/utils");
const BlockCache = require("./blockCache");

const app = process[Symbol.for('app')]
const printErrorStack = process[Symbol.for("printErrorStack")]

const BLOCKS_MAX_NUM = 4;

const blockCache = new BlockCache();

app.post('/blocks', (req, res) => {
	const url = req.body.url;

    assert(typeof url === 'string', `url should be a String, now is ${typeof url}`);

    blockCache.getBlockChainInfo(url, BLOCKS_MAX_NUM).then(blocks => {
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