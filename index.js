var levelup = require("levelup");
var leveldown = require("leveldown");

var db = levelup(leveldown('./data/my-db'));
 
db.put('foo', 'bar')
  .then(function () { 
  	return db.get('foo') 
  }).then(function (value) { 
  	console.log(value) 
  }).catch(function (err) { 
  	console.error(err) 
  });