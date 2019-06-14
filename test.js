var AsyncEventEmitter = require('async-eventemitter');
var events = new AsyncEventEmitter();

events.on('test', function (e, next) {
  // The next event listener will wait til this is done
  setTimeout(next, 1000);
});

events
  .on('test', function (e) {
    // This is a synchronous event listener (note the lack of a second
    // callback argument)
    console.log(e);
    // { data: 'data' }
  })
  .on('test', function (e, next) {
    // Even if you're not truly asynchronous you can use next() to stop propagation
    next(new Error('You shall not pass'));
  });

events.emit('test', function (err) {
  // This is run after all of the event listeners are done
  console.log(err);
  // [Error: You shall not pass]
});