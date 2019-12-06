const vm = require('vm');
const sendToken = require('./utils/sendToken');
const destroy = require('./utils/destroy');
const exit = require('./utils/exit');

const sendBox = {};

//
Reflect.defineProperty(sendBox, 'sendToken', {
  configurable: false,
  enumerable: false,
  writable: false,
  value: sendToken
});

//
Reflect.defineProperty(sendBox, 'destroy', {
  configurable: false,
  enumerable: false,
  writable: false,
  value: destroy
});

//
Reflect.defineProperty(sendBox, 'exit', {
  configurable: false,
  enumerable: false,
  writable: false,
  value: exit
});

//
const vmContext = vm.createContext(sendBox);

//

vm.runInContext(
  'sendToken(); destroy(); exit();',
  vmContext,
  {
    timeout: 5000
  }
);

vm.runInContext(
  'console.log(1)',
  vmContext,
  {
    timeout: 5000
  }
);

