const express = require("express");
const { SUCCESS, PARAM_ERR, OTH_ERR } = require("../constant");
const { port, host } = require("./config.json").http;
const bodyParser = require("body-parser");
const { 
    host: fullConsensusHost, 
    port: fullConsensusPort 
} = require("../consensus_full_server/config.json").http;
const log4js = require("./logConfig");
const rp = require("request-promise");

const logger = log4js.getLogger("command");

const processor = process[Symbol.for("processor")]
const p2p = process[Symbol.for("p2p")];

const app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json({ limit: "1mb" }));

const server = app.listen(port, host, function () {
    logger.info(`server listening at http://${host}:${port}`);
});

log4js.useLogger(app, logger);

app.post("/setMaliciousLeaderCandidate", (req, res) => {
    rp({
        method: "POST",
        uri: `http://${fullConsensusHost}:${fullConsensusPort}/processState`,
        body: {

        },
        json: true
    }).then(({ code, msg, data }) => {
        if(code === SUCCESS)
        {
            processor.setMaliciousLeaderCandidate(data);

            res.send({
                code: SUCCESS
            });
        }
        else
        {
            res.send({
                code: code,
                msg: msg
            })
        }
    }).catch(e => {
        res.send({
            code: OTH_ERR,
            msg: e.toString()
        })
    });
})

app.post("/repealMaliciousLeaderCandidate", (req, res) => {
    
    processor.repealMaliciousLeaderCandidate();
    
    res.send({
        code: SUCCESS
    });
})

app.post("/setMaliciousLeaderRejectServe", (req, res) => {
    rp({
        method: "POST",
        uri: `http://${fullConsensusHost}:${fullConsensusPort}/processState`,
        body: {

        },
        json: true
    }).then(({ code, msg, data }) => {
        if (code === SUCCESS) {
            processor.setMaliciousLeaderRejectServe(data);

            res.send({
                code: SUCCESS
            });
        }
        else {
            res.send({
                code: code,
                msg: msg
            })
        }
    }).catch(e => {
        res.send({
            code: OTH_ERR,
            msg: e.toString()
        })
    });
})

app.post("/repealMaliciousLeaderRejectServe", (req, res) => {

    processor.repealMaliciousLeaderRejectServe();

    res.send({
        code: SUCCESS
    });
});