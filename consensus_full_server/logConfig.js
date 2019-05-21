const log4js = require("log4js")
 
log4js.configure({
    replaceConsole: true,
    appenders: {
        stdout: {
            type: "stdout"
        },
        p2p: {
            type: "dateFile",
            filename: "consensus_full_server/logs/p2p_log/",
            pattern: "p2p-yyyy-MM-dd.log",
            alwaysIncludePattern: true
        },
        net: {
            type: "dateFile",
            filename: "consensus_full_server/logs/net_log/",
            pattern: "net-yyyy-MM-dd.log",
            alwaysIncludePattern: true
        },
        consensus: {
            type: "dateFile",
            filename: "consensus_full_server/logs/consensus_log/",
            pattern: "consensus-yyyy-MM-dd.log",
            alwaysIncludePattern: true
        },
        mysql: {
            type: "dateFile",
            filename: "consensus_full_server/logs/mysql_log/",
            pattern: "mysql-yyyy-MM-dd.log",
            alwaysIncludePattern: true
        },
        update: {
            type: "dateFile",
            filename: "consensus_full_server/logs/update_log/",
            pattern: "update-yyyy-MM-dd.log",
            alwaysIncludePattern: true
        }
    },
    categories: {
        default: { appenders: ["stdout", "consensus"], level: "trace" },
        consensus: { appenders: ["stdout", "consensus"], level: "trace" },
        p2p: { appenders: ["stdout", "p2p"], level: "trace" },
        net: { appenders: ["stdout", "net"], level: "trace" },
        mysql: { appenders: ["stdout", "mysql"], level: "trace" },
        update: { appenders: ["stdout", "update"], level: "trace" }
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