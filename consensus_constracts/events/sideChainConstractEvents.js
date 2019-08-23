const utils = require("../../depends/utils");
const assert = require("assert");
const ConstractEvent = require("./constractEvent");

const Buffer = utils.Buffer;

class CorssPayRequestEvent extends ConstractEvent 
{
  constructor(data) {
    super();

    data = data || {};

    const fields = [{
      length: 32,
      name: "id",
      allowLess: true,
      default: Buffer.alloc(1)
    }, {
      length: 32,
      name: "code",
      allowLess: true,
      default: Buffer.alloc(1)
    }, {
      length: 32,
      name: "timestamp",
      allowLess: true,
      default: Buffer.alloc(1)
    }, {
      length: 32,
      name: "txHash",
      allowLess: true,
      default: Buffer.alloc(1)
    }, {
      length: 32,
      name: "number",
      allowLess: true,
      default: Buffer.alloc(1)
    }, {
      length: 32,
      name: "to",
      allowLess: true,
      default: Buffer.alloc(1)
    }, {
      length: 32,
      name: "value",
      allowLess: true,
      default: Buffer.alloc(1)
    }, {
      length: 32,
      name: "sponsor",
      allowLess: true,
      default: Buffer.alloc(1)
    }];

    utils.defineProperties(this, fields, data);
  }
}

class CorssPayEvent extends ConstractEvent {
  constructor(data) {
    super();

    data = data || {};

    const fields = [{
      length: 32,
      name: "id",
      allowLess: true,
      default: Buffer.alloc(1)
    }, {
      length: 32,
      name: "code",
      allowLess: true,
      default: Buffer.alloc(1)
    }, {
      length: 32,
      name: "timestamp",
      allowLess: true,
      default: Buffer.alloc(1)
    }, {
      length: 32,
      name: "txHash",
      allowLess: true,
      default: Buffer.alloc(1)
    }, {
      length: 32,
      name: "to",
      allowLess: true,
      default: Buffer.alloc(1)
    }, {
      length: 32,
      name: "value",
      allowLess: true,
      default: Buffer.alloc(1)
    }];

    utils.defineProperties(this, fields, data);
  }
}

module.exports = { CorssPayRequestEvent, CorssPayEvent };