const log4js = require("log4js")
 
log4js.configure({
    replaceConsole: true,
    appenders: {
        stdout: {
            type: "stdout"
        },
        req: {
            type: "dateFile",
            filename: "monitor_server/logs/req_log/",
            pattern: "req-yyyy-MM-dd.log",
            alwaysIncludePattern: true
        },
        err: {
            type: "dateFile",
            filename: "monitor_server/logs/err_log/",
            pattern: "err-yyyy-MM-dd.log",
            alwaysIncludePattern: true
        },
        oth: {
            type: "dateFile",
            filename: "monitor_server/logs/oth_log/",
            pattern: "oth-yyyy-MM-dd.log",
            alwaysIncludePattern: true
        }
    },
    categories: {
        default: { appenders: ["stdout", "req"], level: "debug" },
        err: { appenders: ["stdout", "err"], level: "error" },
        oth: { appenders: ["stdout", "oth"], level: "info" }
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