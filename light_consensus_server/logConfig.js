const log4js = require("log4js")
 
log4js.configure({
    replaceConsole: true,
    appenders: {
        stdout: {
            type: "stdout"
        },
        p2p: {
            type: "dateFile",
            filename: "consensus_server/logs/p2p_log/",
            pattern: "p2p-yyyy-MM-dd.log",
            alwaysIncludePattern: true
        },
        net: {
            type: "dateFile",
            filename: "consensus_server/logs/net_log/",
            pattern: "net-yyyy-MM-dd.log",
            alwaysIncludePattern: true
        },
        consensus: {
            type: "dateFile",
            filename: "consensus_server/logs/consensus_log/",
            pattern: "consensus-yyyy-MM-dd.log",
            alwaysIncludePattern: true
        },
        mysql: {
            type: "dateFile",
            filename: "consensus_server/logs/mysql_log/",
            pattern: "mysql-yyyy-MM-dd.log",
            alwaysIncludePattern: true
        },
        update: {
            type: "dateFile",
            filename: "consensus_server/logs/update_log/",
            pattern: "update-yyyy-MM-dd.log",
            alwaysIncludePattern: true
        },
        clientParse: {
            type: "dateFile",
            filename: "consensus_server/logs/clientParse_log/",
            pattern: "clientParse-yyyy-MM-dd.log",
            alwaysIncludePattern: true
        },
        logParse: {
            type: "dateFile",
            filename: "consensus_server/logs/logParse_log/",
            pattern: "logParse-yyyy-MM-dd.log",
            alwaysIncludePattern: true
        }
    },
    categories: {
        default: { appenders: ["stdout", "consensus"], level: "info" },
        consensus: { appenders: ["stdout", "consensus"], level: "info" },
        p2p: { appenders: ["stdout", "p2p"], level: "info" },
        net: { appenders: ["stdout", "net"], level: "info" },
        mysql: { appenders: ["stdout", "mysql"], level: "info" },
        update: { appenders: ["stdout", "update"], level: "info" },
        clientParse: { appenders: ["stdout", "clientParse"], level: "info" },
        logParse: { appenders: ["stdout", "logParse"], level: "info" }
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