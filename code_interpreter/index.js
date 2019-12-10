const vm = require('vm');

//
const sandbox = { globalVar: 1, console };
contextifySandBox = vm.createContext(sandbox);

//
const code = 'while (globalVar < 10) { console.log(globalVar ++); }'

//
const scriptInstance = new vm.Script(code)

//
scriptInstance.runInNewContext(contextifySandBox);


