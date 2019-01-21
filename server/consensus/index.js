const async = require("async")

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
		this.processor = processor;
		this.processor.on("transaction", function(err, next) {
			processTransactions(processor, next);
		});
	}
}

/**
 * Process unconsistent transactions
 */
function processTransactions(processor, next)
{
	async.waterfall([
		function(cb) {
			processor.transactionsPoolSem.take(function(semaphoreLeaveFunc) {
				cb();
			});
		},
		function(cb) {
			processor.consistentTransactionsPoolSem.take(function(semaphoreLeaveFunc) {
				cb();
			});
		},
		function(cb) {
			processor.consistentTransactionsPool.batchPush(processor.transactionsPool.data, cb);
		},
		function(cb) {
			processor.transactionsPool.splice(0, processor.transactionsPool.length, cb);
		}], function() { 
			processor.consistentTransactionsPoolSem.leave();
			processor.transactionsPoolSem.leave();

			processor.emit("consistentTransaction");
			next();
		});
}

module.exports = Consensus;