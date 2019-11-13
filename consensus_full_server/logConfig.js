const log4js = require("log4js")
 
log4js.configure({
    replaceConsole: true,
    appenders: {
        stdout: {
            type: "stdout"
        },
        command: {
            type: "dateFile",
            filename: "consensus_full_server/logs/command_log/",
            pattern: "command-yyyy-MM-dd hh:mm.log",
            alwaysIncludePattern: true
        },
        p2p: {
            type: "dateFile",
            filename: "consensus_full_server/logs/p2p_log/",
            pattern: "p2p-yyyy-MM-dd hh:mm.log",
            alwaysIncludePattern: true
        },
        net: {
            type: "dateFile",
            filename: "consensus_full_server/logs/net_log/",
            pattern: "net-yyyy-MM-dd hh:mm.log",
            alwaysIncludePattern: true
        },
        consensus: {
            type: "dateFile",
            filename: "consensus_full_server/logs/consensus_log/",
            pattern: "consensus-yyyy-MM-dd hh:mm.log",
            alwaysIncludePattern: true
        },
        mysql: {
            type: "dateFile",
            filename: "consensus_full_server/logs/mysql_log/",
            pattern: "mysql-yyyy-MM-dd hh:mm.log",
            alwaysIncludePattern: true
        },
        update: {
            type: "dateFile",
            filename: "consensus_full_server/logs/update_log/",
            pattern: "update-yyyy-MM-dd hh:mm.log",
            alwaysIncludePattern: true
        },
        stageConsensus: {
            type: "dateFile",
            filename: "consensus_full_server/logs/stageConsensus_log/",
            pattern: "stageConsensus-yyyy-MM-dd hh:mm.log",
            alwaysIncludePattern: true
        },
        perishNode: {
            type: "dateFile",
            filename: "consensus_full_server/logs/perishNode_log/",
            pattern: "perishNode-yyyy-MM-dd hh:mm.log",
            alwaysIncludePattern: true
        }
    },
    categories: {
        default: { appenders: ["stdout", "consensus"], level: "info" },
        command: { appenders: ["stdout", "command"], level: "info" },
        consensus: { appenders: ["stdout", "consensus"], level: "info" },
        p2p: { appenders: ["stdout", "p2p"], level: "info" },
        net: { appenders: ["stdout", "net"], level: "info" },
        mysql: { appenders: ["stdout", "mysql"], level: "info" },
        update: { appenders: ["stdout", "update"], level: "info" },
        stageConsensus: { appenders: ["stdout", "stageConsensus"], level: "info" },
        perishNode: { appenders: ["stdout", "perishNode"], level: "info" }
    }
})
 
 
exports.getLogger = function(name)
{
    return log4js.getLogger(name || "default");
}

/**
 * @param {Express} app express instance
 * @param {Log4js} logger 
 */
exports.useLogger = function(app, logger)
{
    app.use(log4js.connectLogger(logger || log4js.getLogger("default"), {
        format: "[:remote-addr :method :url :status :response-timems][:referrer HTTP/:http-version :user-agent]"
    }));
}