const mysql = require("mysql");
const { db } = require("../config.json");

const pool  = mysql.createPool({
  connectionLimit: 10,
  host: db.host,
  user: db.user,
  password: db.password,
  port: db.port,
  database: "easy_bc"
});

pool.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
  if (error) throw error;
  console.log('The solution is: ', results[0].solution);
});


moudle.exports.recordBlock = function(block)
{

}

module.exports.recordAccounts = function(account)
{
	
}