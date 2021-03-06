const log4js = require("log4js")
 
log4js.configure({
    replaceConsole: true,
    appenders: {
        stdout: {
            type: "stdout"
        },
        logParse: {
            type: "dateFile",
            filename: "consensus_log_parser/logs/",
            pattern: "logParse-yyyy-MM-dd.log",
            alwaysIncludePattern: true
        }
    },
    categories: {
        default: { appenders: ["stdout", "logParse"], level: "info" },
        logParse: { appenders: ["stdout", "logParse"], level: "info" }
    }
})

 
exports.getLogger = function(name)
{
    return log4js.getLogger(name || "default");
}