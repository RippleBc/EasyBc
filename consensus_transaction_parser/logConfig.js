const log4js = require("log4js")
 
log4js.configure({
    replaceConsole: true,
    appenders: {
        stdout: {
            type: "stdout"
        },
        transactionParse: {
            type: "dateFile",
            filename: "consensus_transaction_parser/logs/",
            pattern: "transactionParse-yyyy-MM-dd.log",
            alwaysIncludePattern: true
        }
    },
    categories: {
        default: { appenders: ["stdout", "transactionParse"], level: "info" },
        transactionParse: { appenders: ["stdout", "transactionParse"], level: "info" }
    }
})

 
exports.getLogger = function(name)
{
    return log4js.getLogger(name || "default");
}