const Base = require("./base");
const utils = require("../../../depends/utils");

const Buffer = utils.Buffer;

class NewView extends Base {
  constructor(data) {
    super({ name: 'newView' });

    data = data || {};

    const fields = [{
      name: "blockHash",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      name: "number",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      name: "viewChanges",
      allowZero: true,
      default: Buffer.alloc(0)
    }, {
      name: "v",
      length: 1,
      allowZero: true,
      allowLess: true,
      default: Buffer.from([0x1c])
    }, {
      name: "r",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      name: "s",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }];

    utils.defineProperties(this, fields, data);
  }
}

module.exports = NewView;