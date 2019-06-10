const { spawn } = require('child_process');
const ab = spawn('ps', ['-n', '100000', '-c', '400', '-p', 'transaction.json', '-T', 'application/json', 'http://xxx']);

