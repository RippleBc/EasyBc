const AsyncEventEmitter = require("async-eventemitter");

class ConstractExit extends AsyncEventEmitter {
  constructor(txToAccount) {
    super();

    this.txToAccount = txToAccount;
  }

  exit(err) {
    if (err) {
      return this.emit('finish', err);
    }

    this.emit('finish');
  }

  async waitConstractOver() {
    return new Promise((resolve, reject) => {
      this.once('finish', err => {
        if (err) {
          reject(err)
        }

        resolve();
      });
    });
  }
}

module.exports = ConstractExit;