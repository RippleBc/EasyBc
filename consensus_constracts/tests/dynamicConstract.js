const tape = require('tape');
const utils = require("../../depends/utils");
const { COMMAND_DYNAMIC_CREATE,
  COMMAND_DYNAMIC_UPDATE } = require("../constant");
const Transaction = require("../../depends/transaction");
const { getAccountInfo, sendTransaction } = require("../../toolkit/profile/utils");
const { randomBytes } = require("crypto");

const Buffer = utils.Buffer;
const intToBuffer = utils.intToBuffer;
const rlp = utils.rlp;
const BN = utils.BN;

const testCode = `
  class Constract {
    constructor(...args)
    {
      console.log('constructor args:');
      for(let el of args)
      {
        if(el)
        {
          console.log(bufferToInt(el));
        }
      }

      this.raw = args || [];
    }

    async run(commandId, ...args)
    {
      console.log('origin raw:');
      for(let el of this.raw)
      {
        if(el)
        {
          console.log(bufferToInt(el));
        }
      }

      console.log('data:');
      console.log(tx.data.toString('hex'))

      console.log('commandId:');
      console.log(commandId ? bufferToInt(commandId) : 'no command id');

      console.log('udpated raw:');
      this.raw = args;
      for(let el of this.raw)
      {
        if(el)
        {
          console.log(bufferToInt(el));
        }
      }
    }
  }
`

const url = "http://localhost:8081";

const fromAccountKeyPair = {
  privateKey: "9d6ae99d516fec86d7c922d2b3b455205b25cc65d2467d8ecbc47d513cba3841",
  address: "14f8d8e6e23fecd75b4145a4b71a40ba4c9e7739"
}
const toAccountAddress = randomBytes(20);
const codeAccountAddress = randomBytes(20);

console.info(`toAccountAddress: ${toAccountAddress.toString('hex')}`);
console.info(`codeAccountAddress: ${codeAccountAddress.toString('hex')}`);

tape('testing dynamic constract opt', function (tester) {
  
  const it = tester.test
  let fromAccount;

  it('create dynamic constract', function (t) {

    (async () => {
      fromAccount = await getAccountInfo(url, fromAccountKeyPair.address)

      // construct a tx
      const tx = new Transaction({
        to: toAccountAddress,
        value: 1,
        timestamp: Date.now(),
        nonce: new BN(fromAccount.nonce).addn(1).toBuffer(),
        data: rlp.encode([intToBuffer(COMMAND_DYNAMIC_CREATE), codeAccountAddress, Buffer.from(testCode)])
      });

      // sign
      tx.sign(Buffer.from(fromAccountKeyPair.privateKey, 'hex'));

      //
      await sendTransaction(url, tx.serialize().toString('hex'));
    })().then(() => {
      t.end();
    }).catch(e => {
      t.error(e);
    })    
  });

  it('update dynamic constract', function (t) {
    (async () => {
      // construct a tx
      const tx = new Transaction({
        to: toAccountAddress,
        value: 1,
        timestamp: Date.now(),
        nonce: new BN(fromAccount.nonce).addn(2).toBuffer(),
        data: rlp.encode([intToBuffer(COMMAND_DYNAMIC_UPDATE), intToBuffer(1), intToBuffer(2), intToBuffer(3)])
      });

      // sign
      tx.sign(Buffer.from(fromAccountKeyPair.privateKey, 'hex'));

      //
      await sendTransaction(url, tx.serialize().toString('hex'));
    })().then(() => {
      t.end();
    }).catch(e => {
      t.error(e);
    })    
  })

  it('update dynamic constract', function (t) {
    (async () => {
      // construct a tx
      const tx = new Transaction({
        to: toAccountAddress,
        value: 1,
        timestamp: Date.now(),
        nonce: new BN(fromAccount.nonce).addn(3).toBuffer(),
        data: rlp.encode([intToBuffer(COMMAND_DYNAMIC_UPDATE), intToBuffer(4), intToBuffer(5), intToBuffer(6)])
      });

      // sign
      tx.sign(Buffer.from(fromAccountKeyPair.privateKey, 'hex'));

      //
      await sendTransaction(url, tx.serialize().toString('hex'));
    })().then(() => {
      t.end();
    }).catch(e => {
      t.error(e);
    })
  })
})
