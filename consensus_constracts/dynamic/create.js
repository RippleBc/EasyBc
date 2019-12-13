const utils = require("../../depends/utils");
const ConstractExit = require('../api/exit');
const ConstractSendTransaction = require("../api/sendTransaction");

const vm = require("vm");

const rlp = utils.rlp;
const bufferToInt = utils.bufferToInt;
const Buffer = utils.Buffer;


module.exports = async ({ commands, timestamp, stateManager, receiptManager, mysql, tx, fromAccount, toAccount }) => {
  const [codeAccountAddress, code, ...createArgs] = commands;

  // fetch a code account
  const codeAccount = await stateManager.getAccount(codeAccountAddress);

  //
  if (!codeAccount.isEmpty()) {
    await Promise.reject(`ContractsManager run, create a dynamic constract, codeAccount should be emtpy`);
  }

  //
  codeAccount.data = code;

  // save code account
  await stateManager.putAccount(codeAccountAddress, codeAccount.serialize());

  // init
  const exitInstance = new ConstractExit();

  //
  const sendTransactionInstance = new ConstractSendTransaction(tx.from, fromAccount, tx.to, toAccount);

  //
  const evaluateCode = `
      ${code}

      const constract = new Constract();

      constract.create(...createArgs).then(() => {
        
        constract.serialize();

        for(let el of constract.raw)
        {
          raw.push(el);
        }
        
        exit();
      }).catch(e => {
        exit(e);
      });
      `;

  //
  let raw = [];

  vm.runInNewContext(evaluateCode, {
    console,
    require,
    timestamp,
    tx,
    sendTransaction: sendTransactionInstance.send.bind(sendTransactionInstance),
    fromAccountNonce: fromAccount.nonce,
    fromAccountBalance: fromAccount.balance,
    toAccountNonce: toAccount.nonce,
    toAccountBalance: toAccount.balance,
    createArgs,
    exit: exitInstance.exit.bind(exitInstance),
    bufferToInt,
    toBufer: utils.toBuffer,
    BN: utils.BN,
    Buffer,
    raw,
  }, {
    displayErrors: true,
    timeout: 2000
  });

  //
  await exitInstance.updateContractData();

  //
  toAccount.data = rlp.encode([codeAccountAddress, raw]);
}