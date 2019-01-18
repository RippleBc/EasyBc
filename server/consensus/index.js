const async = require("async");

class Consensus
{
	constructor(processor)
	{
		const self = this;

		this.processor = processor;
		this.processor.on("transaction",, function(err, next) {
			processTransactions(processor);
		});
	}
}

function processTransactions(processor)
{
	let transactionsSize;

	async.waterfall([
		function(cb) {
			transactionsSize = processor.consistentTransactionsPool.length;

			//
			processor.batchPush.push(processor.consistentTransactionsPool.data, cb);
		},
		function(cb) {
			processor.splice(0, cb);
		}], function() { 
			processor.emit("consistentTransaction");
		});
}