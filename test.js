const Transaction = require('./depends/transaction')

const transaction = new Transaction();
for(let [key, value] of transaction)
{
	console.log('key: ' + key + ', value: ' + value.toString('hex'))
}

const test = {...transaction};
console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');

for(let key in test)
{
	console.log('key: ' + key + ', value: ' + test[key].toString('hex'))
}
