const utils = require("../../depends/utils");
const assert = require("assert");
const ConstractEvent = require("./constractEvent");

const Buffer = utils.Buffer;

class MultiSignPayRequestEvent extends ConstractEvent {
  constructor(data) {
    super();

    data = data || {};

    const fields = [{
      length: 32,
      name: "id",
      allowLess: true,
      default: Buffer.alloc(1)
    }, {
      length: 20,
      name: "address",
      default: Buffer.alloc(20)
    }, {
      length: 32,
      name: "txHash",
      default: Buffer.alloc(32)
    }, {
      length: 32,
      name: "name",
      allowLess: true,
      default: Buffer.alloc(1)
    }, {
      length: 32,
      name: "action",
      allowLess: true,
      default: Buffer.alloc(1)
    }, {
      length: 32,
      name: "timestamp",
      allowLess: true,
      default: Buffer.alloc(1)
    }, {
      length: 20,
      name: "to",
      default: Buffer.alloc(20)
    }, {
      length: 32,
      name: "value",
      allowLess: true,
      default: Buffer.alloc(1)
    }, {
      length: 20,
      name: "sponsor",
      default: Buffer.alloc(20)
    }];

    utils.defineProperties(this, fields, data);

    this.name = 'MultiSignPayRequestEvent';
  }
}

class MultiSignPayEvent extends ConstractEvent {
  constructor(data) {
    super();

    data = data || {};

    const fields = [{
      length: 32,
      name: "id",
      allowLess: true,
      default: Buffer.alloc(1)
    }, {
      length: 20,
      name: "address",
      default: Buffer.alloc(20)
    }, {
      length: 32,
      name: "txHash",
      default: Buffer.alloc(32)
    }, {
      length: 32,
      name: "name",
      allowLess: true,
      default: Buffer.alloc(1)
    }, {
      length: 32,
      name: "timestamp",
      allowLess: true,
      default: Buffer.alloc(1)
    }, {
      length: 20,
      name: "to",
      default: Buffer.alloc(20)
    }, {
      length: 32,
      name: "value",
      allowLess: true,
      default: Buffer.alloc(1)
    }];

    utils.defineProperties(this, fields, data);

    this.name = 'MultiSignPayEvent';
  }
}

module.exports = { MultiSignPayRequestEvent, MultiSignPayEvent };