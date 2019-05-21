const log4js = require("log4js")
 
log4js.configure({
    replaceConsole: true,
    appenders: {
        stdout: {
            type: "stdout"
        },
        logParse: {
            type: "dateFile",
            filename: "log_parser/logs/",
            pattern: "logParse-yyyy-MM-dd.log",
            alwaysIncludePattern: true
        }
    },
    categories: {
        default: { appenders: ["stdout", "logParse"], level: "trace" },
        logParse: { appenders: ["stdout", "logParse"], level: "trace" }
    }
})

 
exports.getLogger = function(name)
{
    return log4js.getLogger(name || "default");
}