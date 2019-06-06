const { SUCCESS } = require("../../constant");
const {assert, expect, should} = require("chai"); 
const rp = require("request-promise");
const Account = require("../../depends/account")
const ADDRESS = "21d21b68ded27ce2ef619651d382892c1f77baa4"
const URL = "http://localhost:8081"
const TX_HASH = "14a8fd2c8e46b9df2b5fb2ad6c7fa4a023aaf37906a8abfddd66b0bd757a354c"

describe("block test", function() {
	it("check getAccountInfo", function(done) {
		const options = {
        method: "POST",
        uri: `${URL}/getAccountInfo`,
        body: {
            address: ADDRESS
        },
        json: true // Automatically stringifies the body to JSON
    };
    
    rp(options).then(response => {
        if(response.code !== SUCCESS)
        {
            reject(response.msg);
        }

        const account = new Account(response.data)

        assert.equal(account.balance, "")
        assert.equal(account.nonce.toString("hex"), "01")

        done();
    }).catch(e => {
        done(e.toString());
    });
  });
});