const log4js = require("log4js")
 
log4js.configure({
    replaceConsole: true,
    appenders: {
        stdout: {
            type: "stdout"
        },
        command: {
            type: "dateFile",
            filename: "p2p_proxy_server/logs/command_log/",
            pattern: "command-yyyy-MM-dd hh:mm.log",
            alwaysIncludePattern: true
        },
        p2p: {
            type: "dateFile",
            filename: "p2p_proxy_server/logs/p2p_log/",
            pattern: "p2p-yyyy-MM-dd hh:mm.log",
            alwaysIncludePattern: true
        },
        net: {
            type: "dateFile",
            filename: "p2p_proxy_server/logs/net_log/",
            pattern: "net-yyyy-MM-dd hh:mm.log",
            alwaysIncludePattern: true
        },
        proxy: {
            type: "dateFile",
            filename: "p2p_proxy_server/logs/proxy_log/",
            pattern: "proxy-yyyy-MM-dd hh:mm.log",
            alwaysIncludePattern: true
        },
      
    },
    categories: {
        default: { appenders: ["stdout", "proxy"], level: "info" },
        command: { appenders: ["stdout", "command"], level: "info" },
        p2p: { appenders: ["stdout", "p2p"], level: "info" },
        net: { appenders: ["stdout", "net"], level: "info" },
        proxy: { appenders: ["stdout", "proxy"], level: "info" }
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