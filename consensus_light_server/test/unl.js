const { SUCCESS } = require("../../constant");
const { assert, expect, should } = require("chai");
const rp = require("request-promise");
const utils = require("../../depends/utils");
const { TEST_URL } = require("../constant")
const { privateKey: privateKeyHexString } = require("../config")

const Buffer = utils.Buffer;
const rlp = utils.rlp;

const privateKey = Buffer.from(privateKeyHexString, "hex");

describe("block check", function () {
    it("check deleteNodes", done => {

        const data = [
            {
                "address": "68ecab823675efa71e2edbe26a56b7a0d765dcde",
                "queryPort": 8084,
                "p2pPort": 8083,
                "host": "localhost1",
                "state": 1
            },
            {
                "address": "a20e4e1f76c64d8ba70237df08e15dfeb4c5f0f1",
                "queryPort": 8086,
                "p2pPort": 8085,
                "host": "localhost1",
                "state": 1
            }
        ];

        const timestamp = Date.now();

        // convert json object to Buffer
        const dataBuffer = Buffer.from(JSON.stringify(data))

        // convert int to Buffer
        const timestampBuffer = utils.toBuffer(timestamp)

        // compute hash
        const hash = utils.sha256(rlp.encode([dataBuffer, timestampBuffer]));

        // compute sig
        const sig = utils.ecsign(hash, privateKey)
        sig.r = sig.r.toString("hex");
        sig.s = sig.s.toString("hex");

        const options = {
            method: "POST",
            uri: `${TEST_URL}/deleteNodes`,
            body: {
                data: data,
                timestamp: timestamp,
                sig: sig
            },
            json: true // Automatically stringifies the body to JSON
        };

        rp(options).then(response => {
            if (response.code !== SUCCESS) {
                return done(response.msg);
            }

            done();
        }).catch(e => {
            done(e.toString());
        });
    })

    it("check addNodes", done => {

        const data = [
            {
                "address": "68ecab823675efa71e2edbe26a56b7a0d765dcde",
                "queryPort": 8084,
                "p2pPort": 8083,
                "host": "localhost1",
                "state": 1
            },
            {
                "address": "a20e4e1f76c64d8ba70237df08e15dfeb4c5f0f1",
                "queryPort": 8086,
                "p2pPort": 8085,
                "host": "localhost1",
                "state": 1
            }
        ];
        
        const timestamp = Date.now();

        // convert json object to Buffer
        const dataBuffer = Buffer.from(JSON.stringify(data))

        // convert int to Buffer
        const timestampBuffer = utils.toBuffer(timestamp)

        // compute hash
        const hash = utils.sha256(rlp.encode([dataBuffer, timestampBuffer]));

        // compute sig
        const sig = utils.ecsign(hash, privateKey)
        sig.r = sig.r.toString("hex");
        sig.s = sig.s.toString("hex");

        const options = {
            method: "POST",
            uri: `${TEST_URL}/addNodes`,
            body: {
                data: data,
                timestamp: timestamp,
                sig: sig
            },
            json: true // Automatically stringifies the body to JSON
        };

        rp(options).then(response => {
            if (response.code !== SUCCESS) {
                return done(response.msg);
            }

            done();
        }).catch(e => {
            done(e.toString());
        });
    })

    it("check unl", done => {
        const options = {
            method: "POST",
            uri: `${TEST_URL}/unl`,
            body: {

            },
            json: true // Automatically stringifies the body to JSON
        };

        rp(options).then(response => {
            if (response.code !== SUCCESS) {
                return done(response.msg);
            }

            console.log(response.data)

            done();
        }).catch(e => {
            done(e.toString());
        });
    });

    it("check updateNodes", done => {

        const data = [
            {
                "address": "68ecab823675efa71e2edbe26a56b7a0d765dcde",
                "queryPort": 8084,
                "p2pPort": 8083,
                "host": "localhost1",
                "state": 2
            },
            {
                "address": "a20e4e1f76c64d8ba70237df08e15dfeb4c5f0f1",
                "queryPort": 8086,
                "p2pPort": 8085,
                "host": "localhost1",
                "state": 2
            }
        ];

        const timestamp = Date.now();

        // convert json object to Buffer
        const dataBuffer = Buffer.from(JSON.stringify(data))

        // convert int to Buffer
        const timestampBuffer = utils.toBuffer(timestamp)

        // compute hash
        const hash = utils.sha256(rlp.encode([dataBuffer, timestampBuffer]));

        // compute sig
        const sig = utils.ecsign(hash, privateKey)
        sig.r = sig.r.toString("hex");
        sig.s = sig.s.toString("hex");

        const options = {
            method: "POST",
            uri: `${TEST_URL}/updateNodes`,
            body: {
                data: data,
                timestamp: timestamp,
                sig: sig
            },
            json: true // Automatically stringifies the body to JSON
        };

        rp(options).then(response => {
            if (response.code !== SUCCESS) {
                return done(response.msg);
            }

            done();
        }).catch(e => {
            done(e.toString());
        });
    })

    it("check unl", done => {
        const options = {
            method: "POST",
            uri: `${TEST_URL}/unl`,
            body: {

            },
            json: true // Automatically stringifies the body to JSON
        };

        rp(options).then(response => {
            if (response.code !== SUCCESS) {
                return done(response.msg);
            }

            console.log(response.data)

            done();
        }).catch(e => {
            done(e.toString());
        });
    });
});