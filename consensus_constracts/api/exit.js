const AsyncEventEmitter = require("async-eventemitter");
const assert = require("assert");

class ConstractExit extends AsyncEventEmitter {
  constructor() {
    super();
  }

  exit(err, data) {
    if (err) {
      return this.emit('finish', err);
    }

    this.emit('finish', null, data);
  }

  async fetchUpdatedContractData() {
    return new Promise((resolve, reject) => {
      this.once('finish', (err, data) => {
        if (err) {
          reject(err)
        }

        resolve(data);
      });
    });
  }
}

module.exports = ConstractExit;