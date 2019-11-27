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
        }
    },
    categories: {
        default: { appenders: ["stdout", "consensus"], level: "warn" },
        command: { appenders: ["stdout", "command"], level: "warn" },
        consensus: { appenders: ["stdout", "consensus"], level: "warn" },
        p2p: { appenders: ["stdout", "p2p"], level: "warn" },
        net: { appenders: ["stdout", "net"], level: "warn" },
        mysql: { appenders: ["stdout", "mysql"], level: "warn" },
        update: { appenders: ["stdout", "update"], level: "warn" },
        stageConsensus: { appenders: ["stdout", "stageConsensus"], level: "warn" }
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