const tape = require('tape');
const utils = require("../../../depends/utils");
const { COMMAND_DYNAMIC_CREATE,
  COMMAND_DYNAMIC_UPDATE } = require("../../constant");
const Transaction = require("../../../depends/transaction");
const { getAccountInfo, sendTransaction } = require("../../../toolkit/profile/utils");
const { randomBytes } = require("crypto");
const fs = require("fs");
const path = require("path");

const Buffer = utils.Buffer;
const intToBuffer = utils.intToBuffer;
const rlp = utils.rlp;
const BN = utils.BN;

const url = "http://localhost:8081";

const fromAccountKeyPair = {
  privateKey: "ed09a7280c5a0d3c04839ca5603fe507b4d1d4572601e62aadafd923f55f7bf9",
  address: "21d21b68ded27ce2ef619651d382892c1f77baa4"
}
const toAccountAddress = randomBytes(20);
const codeAccountAddress = randomBytes(20);

const gambleCode = fs.readFileSync(path.join(__dirname, "./gamble.js"), {
  encoding: 'utf8'
});

tape('testing dynamic constract opt', function (tester) {
  
  const it = tester.test
  let fromAccount;

  it('create dynamic constract', function (t) {

    (async () => {
      fromAccount = await getAccountInfo(url, fromAccountKeyPair.address)
      console.log(`fromBalance: ${fromAccount.balance.toString('hex')}\n\n`)

      // construct a tx
      const tx = new Transaction({
        to: toAccountAddress,
        value: 1,
        timestamp: Date.now(),
        nonce: new BN(fromAccount.nonce).addn(1).toBuffer(),
        data: rlp.encode([intToBuffer(COMMAND_DYNAMIC_CREATE), codeAccountAddress, Buffer.from(gambleCode)])
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

  it('check', t => {
    (async () => {
      await new Promise(resolve => {
        setTimeout(() => {
          resolve();
        }, 2000);
      });

      const toAccount = await getAccountInfo(url, toAccountAddress.toString('hex'));

      const [, args] = rlp.decode(toAccount.data);

      console.log(`state: ${args[0].toString('hex')}, beginTime: ${args[1].toString('hex')}, maxRandomNum: ${args[3].toString('hex')}`);
      console.log('gambleResult: ')
      for (let [key, value] of args[2]) {
        console.log(`address: ${key.slice(0, 20).toString('hex')}, nonce: ${key.slice(20).toString('hex')}, dice: ${value.toString('hex')}`);
      }

      console.log();
    })().then(() => {
      t.end();
    }).catch(e => {
      t.error(e);
    })
  });

  it('bet 100', function (t) {
    (async () => {
      // construct a tx
      const tx = new Transaction({
        to: toAccountAddress,
        value: 100,
        timestamp: Date.now(),
        nonce: new BN(fromAccount.nonce).addn(2).toBuffer(),
        data: rlp.encode([intToBuffer(COMMAND_DYNAMIC_UPDATE), intToBuffer(1)])
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

  it('check 100', t => {
    (async () => {
      await new Promise(resolve => {
        setTimeout(() => {
          resolve();
        }, 2000);
      });

      const toAccount = await getAccountInfo(url, toAccountAddress.toString('hex'));

      const [, args] = rlp.decode(toAccount.data);

      console.log(`state: ${args[0].toString('hex')}, beginTime: ${args[1].toString('hex')}, maxRandomNum: ${args[3].toString('hex')}`);
      console.log('gambleResult: ')
      for (let [key, value] of args[2])
      {
        console.log(`address: ${key.slice(0, 20).toString('hex')}, nonce: ${key.slice(20).toString('hex')}, dice: ${value.toString('hex')}`);
      }

      console.log();
    })().then(() => {
      t.end();
    }).catch(e => {
      t.error(e);
    })  
  });

  it('bet 200', function (t) {
    (async () => {
      // construct a tx
      const tx = new Transaction({
        to: toAccountAddress,
        value: 100,
        timestamp: Date.now(),
        nonce: new BN(fromAccount.nonce).addn(3).toBuffer(),
        data: rlp.encode([intToBuffer(COMMAND_DYNAMIC_UPDATE), intToBuffer(1)])
      });

      // sign
      tx.sign(Buffer.from(fromAccountKeyPair.privateKey, 'hex'));

      //
      await sendTransaction(url, tx.serialize().toString('hex'));
    })().then(() => {
      t.end();
    }).catch(e => {
      t.error(e);
    });
  })

  it('check 200', t => {
    (async () => {
      await new Promise(resolve => {
        setTimeout(() => {
          resolve();
        }, 2000);
      });

      const toAccount = await getAccountInfo(url, toAccountAddress.toString('hex'));

      const [, args] = rlp.decode(toAccount.data);

      console.log(`state: ${args[0].toString('hex')}, beginTime: ${args[1].toString('hex')}, maxRandomNum: ${args[3].toString('hex')}`);
      console.log('gambleResult: ')
      for (let [key, value] of args[2]) {
        console.log(`address: ${key.slice(0, 20).toString('hex')}, nonce: ${key.slice(20).toString('hex')}, dice: ${value.toString('hex')}`);
      }

      console.log();
    })().then(() => {
      t.end();
    }).catch(e => {
      t.error(e);
    })
  });

  it('draw', function (t) {
    (async () => {

      await new Promise(resolve => {
        setTimeout(() => {
          resolve();
        }, 2000);
      });

      // construct a tx
      const tx = new Transaction({
        to: toAccountAddress,
        value: 500,
        timestamp: Date.now(),
        nonce: new BN(fromAccount.nonce).addn(4).toBuffer(),
        data: rlp.encode([intToBuffer(COMMAND_DYNAMIC_UPDATE), intToBuffer(2)])
      });

      // sign
      tx.sign(Buffer.from(fromAccountKeyPair.privateKey, 'hex'));

      //
      await sendTransaction(url, tx.serialize().toString('hex'));
    })().then(() => {
      t.end();
    }).catch(e => {
      t.error(e);
    });
  })

  it('check draw', t => {
    (async () => {
      await new Promise(resolve => {
        setTimeout(() => {
          resolve();
        }, 2000);
      });

      const toAccount = await getAccountInfo(url, toAccountAddress.toString('hex'));

      const [, args] = rlp.decode(toAccount.data);

      console.log(`state: ${args[0].toString('hex')}, beginTime: ${args[1].toString('hex')}, maxRandomNum: ${args[3].toString('hex')}`);
      console.log('gambleResult: ')
      for (let [key, value] of args[2]) {
        console.log(`address: ${key.slice(0, 20).toString('hex')}, nonce: ${key.slice(20).toString('hex')}, dice: ${value.toString('hex')}`);
      }

      console.log();

      const fromAccount = await getAccountInfo(url, fromAccountKeyPair.address)
      console.log(`fromBalance: ${fromAccount.balance.toString('hex')}\n\n`)
    })().then(() => {
      t.end();
    }).catch(e => {
      t.error(e);
    })
  });
})
