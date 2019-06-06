const { TRANSACTION_STATE_PACKED, SUCCESS } = require("../../constant");
const {assert, expect, should} = require("chai"); 
const rp = require("request-promise");
const Account = require("../../depends/account")
const Block = require("../../depends/block")
const ADDRESS = "85d600e29b49d03adf22ad2535d43f10820a390e"
const TX_HASH = "14a8fd2c8e46b9df2b5fb2ad6c7fa4a023aaf37906a8abfddd66b0bd757a354c"
const utils = require("../../depends/utils");
const { TEST_URL } = require("../constant")

const Buffer = utils.Buffer;

describe("block check", function() {
	it("check getAccountInfo", done => {
		const options = {
        method: "POST",
        uri: `${TEST_URL}/getAccountInfo`,
        body: {
            address: ADDRESS
        },
        json: true // Automatically stringifies the body to JSON
    };
    
    rp(options).then(response => {
        if(response.code !== SUCCESS)
        {
            return done(response.msg);
        }

        const account = new Account(Buffer.from(response.data, "hex"))

        assert.equal(account.balance.toString("hex"), "00")
        assert.equal(account.nonce.toString("hex"), "01")

        done();
    }).catch(e => {
        done(e.toString());
    });
  });

  it("check getTransactionState", done => {
  	const options = {
        method: "POST",
        uri: `${TEST_URL}/getTransactionState`,
        body: {
            hash: TX_HASH
        },
        json: true // Automatically stringifies the body to JSON
    };
    
    rp(options).then(response => {
        if(response.code !== SUCCESS)
        {
            return done(response.msg);
        }

        assert.equal(response.data, TRANSACTION_STATE_PACKED)

        done();
    }).catch(e => {
        done(e.toString());
    });
  })

  it("check getTransactions should be success", done => {
  	const options = {
        method: "POST",
        uri: `${TEST_URL}/getTransactions`,
        body: {
            
        },
        json: true // Automatically stringifies the body to JSON
    };
    
    rp(options).then(response => {
        if(response.code !== SUCCESS)
        {
        	return done()
        }

        done("getTransactions should be failed")
    }).catch(e => {
        done(e.toString());
    });
  })

  it("check getTransactions should be failed", done => {
  	const options = {
        method: "POST",
        uri: `${TEST_URL}/getTransactions`,
        body: {
            offset: 0,
            limit: 5,
            beginTime: 0,
            endTime: Date.now()
        },
        json: true // Automatically stringifies the body to JSON
    };
    
    rp(options).then(response => {
        if(response.code !== SUCCESS)
        {
        	return done(response.msg)
        }

        assert.equal(response.data.length, 5)

        done();
    }).catch(e => {
        done(e.toString());
    });
  })

  it("check getBlockByNumber", done => {
  	const options = {
        method: "POST",
        uri: `${TEST_URL}/getBlockByNumber`,
        body: {
            number: "00",
        },
        json: true // Automatically stringifies the body to JSON
    };
    
    rp(options).then(response => {
        if(response.code !== SUCCESS)
        {
        	return done(response.msg)
        }

        const block = new Block(Buffer.from(response.data, "hex"))

        assert.equal(block.hash().toString("hex"), "96f7e6cd9b09ccf3c6c8acf520fec5839a8f480bdce81f4bfe157a9f58689f16")

        done();
    }).catch(e => {
        done(e.toString());
    });
  })

  it("check getLastestBlock", done => {
  	const options = {
        method: "POST",
        uri: `${TEST_URL}/getLastestBlock`,
        body: {
            
        },
        json: true // Automatically stringifies the body to JSON
    };
    
    rp(options).then(response => {
        if(response.code !== SUCCESS)
        {
        	return done(response.msg)
        }

        const block = new Block(Buffer.from(response.data, "hex"))

        assert.notEqual(block.header.number.toString("hex"), "");

        done();
    }).catch(e => {
        done(e.toString());
    });
  })
});