const { SUCCESS } = require("../../constant");
const { assert, expect, should } = require("chai"); 
const rp = require("request-promise");
const { TEST_URL } = require("../constant")

describe("processor state check", function() {
  it("check status", done => {
  	const options = {
        method: "POST",
        uri: `${TEST_URL}/status`,
        body: {
           
        },
        json: true // Automatically stringifies the body to JSON
    };
    
    rp(options).then(response => {
        done();
    }).catch(e => {
        done(e.toString());
    });
  })

  it("check logs", done => {
  	const options = {
        method: "POST",
        uri: `${TEST_URL}/logs`,
        body: {
        	offset: 0,
          limit: 10,
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

        assert.equal(response.data.logs.length, 10)

        done();
    }).catch(e => {
        done(e.toString());
    });
  })

  it("check timeConsume", done => {
  	const options = {
        method: "POST",
        uri: `${TEST_URL}/timeConsume`,
        body: {
          offset: 0,
          limit: 10,
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

        assert.equal(response.data.length, 10)

        done();
    }).catch(e => {
        done(e.toString());
    });
  })

  it("check abnormalNodes", done => {
  	const options = {
        method: "POST",
        uri: `${TEST_URL}/abnormalNodes`,
        body: {
      		type: 1,
          offset: 0,
          limit: 10,
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

        assert.notEqual(response.data.length, 0)

        done();
    }).catch(e => {
        done(e.toString());
    });
  })

  it("check abnormalNodes", done => {
  	const options = {
        method: "POST",
        uri: `${TEST_URL}/abnormalNodes`,
        body: {
      		type: 2,
          offset: 0,
          limit: 10,
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

        assert.notEqual(response.data.length, 0)

        done();
    }).catch(e => {
        done(e.toString());
    });
  })
});