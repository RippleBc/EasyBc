const utils = require("../../depends/utils");
const ConstractExit = require('../api/exit');
const ConstractSendTransaction = require("../api/sendTransaction");

const vm = require("vm");

const rlp = utils.rlp;
const bufferToInt = utils.bufferToInt;
const Buffer = utils.Buffer;


module.exports = async ({ commands, timestamp, stateManager, receiptManager, mysql, tx, fromAccount, toAccount }) => {
  // fetch code address and basic data
  let [codeAccountAddress, constractData] = rlp.decode(toAccount.data);

  // fetch code
  const codeAccount = await stateManager.getAccount(codeAccountAddress);
  if (codeAccount.isEmpty()) {
    await Promise.reject(`ContractsManager run, codeAccount ${codeAccountAddress.toString('hex')} is empty`);
  }

  //
  let code = codeAccount.data.toString();

  // 
  const exitInstance = new ConstractExit();

  //
  const sendTransactionInstance = new ConstractSendTransaction(tx.from, fromAccount, tx.to, toAccount);

  //
  const evaluateCode = `
      const { rlp } = require("../../depends/utils");

      ${code}

      const constract = new Constract(...constractData);

      constract.run(...commands).then(() => {
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
    constractData,
    commands,
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