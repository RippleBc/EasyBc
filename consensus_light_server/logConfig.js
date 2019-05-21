const log4js = require("log4js")
 
log4js.configure({
    replaceConsole: true,
    appenders: {
        stdout: {
            type: "stdout"
        },
        clientParse: {
            type: "dateFile",
            filename: "consensus_light_server/logs/",
            pattern: "clientParse-yyyy-MM-dd.log",
            alwaysIncludePattern: true
        }
    },
    categories: {
        default: { appenders: ["stdout", "clientParse"], level: "info" },
        clientParse: { appenders: ["stdout", "clientParse"], level: "info" }
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