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
      name: "name",
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
      default: Buffer.alloc(32)
    }, {
      length: 32,
      name: "number",
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

    this.name = 'CorssPayRequestEvent';
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
      name: "name",
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
      default: Buffer.alloc(32)
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

    this.name = 'CorssPayEvent';
  }
}

class AppendGuaranteeEvent extends ConstractEvent {
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
      name: "name",
      allowLess: true,
      default: Buffer.alloc(1)
    }, {
      length: 32,
      name: "code",
      allowLess: true,
      default: Buffer.alloc(1)
    }, {
      length: 32,
      name: "txHash",
      default: Buffer.alloc(1)
    }, {
      length: 20,
      name: "from",
      default: Buffer.alloc(1)
    }, {
      length: 32,
      name: "value",
      allowLess: true,
      default: Buffer.alloc(1)
    },];

    utils.defineProperties(this, fields, data);

    this.name = 'AppendGuaranteeEvent';
  }
}

module.exports = { CorssPayRequestEvent, CorssPayEvent, AppendGuaranteeEvent };