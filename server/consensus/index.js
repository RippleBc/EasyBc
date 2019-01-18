const async = require("async");

/**
 * Creates a new consensus object
 *
 * @class
 * @constructor
 * @prop 
 */
class Consensus
{
	constructor(processor)
	{
		const self = this;

		this.processor = processor;
		this.processor.on("transaction", function(err, next) {
			processTransactions(processor, next);
		});
	}
}

function processTransactions(processor, next)
{
	async.waterfall([
		function(cb) {
			processor.consistentTransactionsPool.batchPush(processor.transactionsPool.data, cb);
		},
		function(cb) {
			processor.transactionsPool.splice(0, null, cb);
		}], function() { 
			processor.emit("consistentTransaction");
			next();
		});
}