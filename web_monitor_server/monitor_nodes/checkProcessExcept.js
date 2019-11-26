const rp = require("request-promise");
const sendSMSAlarm = require("./smsAlarm");
const sendEMailAlarm = require("./eMailAlarm");
const assert = require("assert");

const logger = process[Symbol.for('logger')];
const { Node } = process[Symbol.for('models')]

const CHECK_PROCESS_EXCEPTION_INTERVAL = 10000;

const CHECK_PROCESS_EXCEPTION_STATE_CLOSE = 1;
const CHECK_PROCESS_EXCEPTION_STATE_CHECKING = 2;
const CHECK_PROCESS_EXCEPTION_STATE_CHECKED = 3;

class CheckProcessExcept {
  constructor({ name, address, host, port, remarks, type }) {

    assert(typeof name === 'string', `CheckProcessExcept constructor, name should be a String, now is ${name}`)
    assert(typeof address === 'string', `CheckProcessExcept constructor, address should be a String, now is ${address}`)
    assert(typeof host === 'string', `CheckProcessExcept constructor, host should be a String, now is ${host}`)
    assert(typeof port === 'string', `CheckProcessExcept constructor, port should be a String, now is ${port}`)
    assert(typeof remarks === 'string', `CheckProcessExcept constructor, remarks should be a String, now is ${remarks}`)
    assert(typeof type === 'string', `CheckProcessExcept constructor, type should be a String, now is ${type}`)

    this.name = name
    this.address = address
    this.host = host
    this.port = port
    this.remarks = remarks
    this.type = type

    this.state = CHECK_PROCESS_EXCEPTION_STATE_CLOSE;
    this.exceptLogs = [];
    this.localLastestLogIndex = undefined;
  }

  open() {
    this.state = CHECK_PROCESS_EXCEPTION_STATE_CHECKING;
  }

  close() {
    this.state = CHECK_PROCESS_EXCEPTION_STATE_CLOSE;
  }

  async fetchLastestLogs() {
    if (this.state === CHECK_PROCESS_EXCEPTION_STATE_CLOSE) {
      return;
    }


    let logs;

    try {
      ({ data: { logs } } = await rp({
        method: "POST",
        uri: `${this.host}:${this.port}/logs`,
        body: {
          offset: 0,
          limit: 5,
          type: this.type
        },
        json: true
      }));
    }
    catch (e) {

      if (this.state !== CHECK_PROCESS_EXCEPTION_STATE_CHECKING) {
        logger.error(`CheckProcessExcept fetchLastestLogs, fetch log from light server, ${e}`);

        return;
      }

      //
      this.exceptLogs.push(`can not connect to ${this.name}, ${this.address}, ${this.host}, ${this.port}, ${this.remarks}`);

      //
      this.state = CHECK_PROCESS_EXCEPTION_STATE_CHECKED;

      return;
    }

    //
    const lastestLogIndex = logs[0] ? logs[0].id : 0;

    // init localLastestLogIndex
    if (undefined === this.localLastestLogIndex) {
      this.localLastestLogIndex = lastestLogIndex
    }

    // check state
    if (this.state !== CHECK_PROCESS_EXCEPTION_STATE_CHECKING) {
      return;
    }


    // there exists new log
    if (lastestLogIndex > this.localLastestLogIndex) {
      // 
      for (let log of logs) {
        if (log.id > this.localLastestLogIndex) {
          this.exceptLogs.push(`title: ${log.title}, data: ${log.data}`);
        }
      }

      this.state = CHECK_PROCESS_EXCEPTION_STATE_CHECKED
    }
  }

  reset() {
    this.state = CHECK_PROCESS_EXCEPTION_STATE_CHECKING;
    this.exceptLogs = [];
    this.localLastestLogIndex = undefined;
  }
}

class CheckAllProcessExcept
{
  constructor()
  {
    this.state = CHECK_PROCESS_EXCEPTION_STATE_CLOSE;

    this.checkers = new Map();

    // init
    this.init().then(() => {
      logger.info(`CheckAllProcessExcept:\n${[...this.checkers.values()].map(val => `name: ${val.name}, address: ${val.address}, type: ${val.type}`).join('\n')}`)

      setInterval(this.checkProcessException.bind(this), CHECK_PROCESS_EXCEPTION_INTERVAL);
    });
  }

  async init()
  {
    const nodes = await Node.findAll();
    
    //
    for (let { name, address, host, port, remarks } of nodes) {
      this.checkers.set(`${address}-ERROR`, new CheckProcessExcept({ name, address, host, port, remarks, type: 'ERROR' }));
      this.checkers.set(`${address}-FATAL`, new CheckProcessExcept({ name, address, host, port, remarks, type: 'FATAL' }));
    }

    //
    for (let checkProcessExceptInstance of this.checkers.values())
    {
      checkProcessExceptInstance.open(); 
      await checkProcessExceptInstance.fetchLastestLogs();
    }
  }

  /**
   * @param {String} address
   */
  getState(address)
  {
    assert(typeof address === 'string', `CheckAllProcessExcept getState, address should be a String, now is ${typeof address}`);
    
    return {
      error: this.checkers.get(`${address}-ERROR`).state,
      fatal: this.checkers.get(`${address}-FATAL`).state
    }
  }

  /**
   * @param {String} address
   */
  openCheckProcessException(address) {
    assert(typeof address === 'string', `CheckAllProcessExcept openCheckProcessException, address should be a String, now is ${typeof address}`);

    const checkProcessExceptErrorInstance = this.checkers.get(`${address}-ERROR`);
    const checkProcessExceptFatalInstance = this.checkers.get(`${address}-FATAL`);

    if (!checkProcessExceptErrorInstance)
    {
      throw new Error(`CheckAllProcessExcept openCheckProcessException, instance ${address}-ERROR not exist`);
    }

    if (!checkProcessExceptFatalInstance)
    {
      throw new Error(`CheckAllProcessExcept openCheckProcessException, instance ${address}-FATAL not exist`);
    }

    //
    if (checkProcessExceptErrorInstance.state === CHECK_PROCESS_EXCEPTION_STATE_CHECKED)
    {
      checkProcessExceptErrorInstance.reset();
    }

    //
    if (checkProcessExceptErrorInstance.state === CHECK_PROCESS_EXCEPTION_STATE_CHECKED) {
      checkProcessExceptErrorInstance.reset();
    }
  }

  async checkProcessException()
  {
    const exceptInfo = [];

    for (let checkProcessExceptInstance of this.checkers.values()) {
      await checkProcessExceptInstance.fetchLastestLogs();

      if(checkProcessExceptInstance.state === CHECK_PROCESS_EXCEPTION_STATE_CHECKED)
      {
        exceptInfo.push(`name: ${checkProcessExceptInstance.name}, address: ${checkProcessExceptInstance.address}, host: ${checkProcessExceptInstance.host}, port: ${checkProcessExceptInstance.port}, remarks: ${checkProcessExceptInstance.remarks}, type: ${checkProcessExceptInstance.type}, exceptLogs: ${checkProcessExceptInstance.exceptLogs.join(";")}`);
        

        // close
        checkProcessExceptInstance.close();
      }
    }

    if (exceptInfo.length > 0)
    {
      const text = exceptInfo.join("\n");
      console.log(text);

      // sendEMailAlarm(text);
      // sendSMSAlarm();
    }
  }
}

module.exports = CheckAllProcessExcept;