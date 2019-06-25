const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();
myEmitter.once('event', () => {
  console.log('触发事件1');
});

myEmitter.once('event', () => {
  console.log('触发事件2');
});
myEmitter.emit('event');
myEmitter.emit('event');
myEmitter.emit('event');
