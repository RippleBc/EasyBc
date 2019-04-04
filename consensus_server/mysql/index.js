const mysql = require("mysql");
const { mysql } = require("../config.json");

const pool  = mysql.createPool({
  connectionLimit: 10,
  host: mysql.host,
  user: mysql.user,
  password: mysql.password,
  port: mysql.port,
  database: "easy_bc"
});

moudle.exports.recordBlock = function(block)
{
	pool.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
	  if (error) throw error;
	  console.log('The solution is: ', results[0].solution);
	});
}

module.exports.recordAccounts = function(account)
{
	
}