const rp = require("request-promise");
const sendSMSAlarm = require("./smsAlarm");
const sendEMailAlarm = require("./eMailAlarm");
const assert = require("assert");
const schedule = require('node-schedule');

const logger = process[Symbol.for('logger')];
const { Node } = process[Symbol.for('models')]
const levelDownInstance = process[Symbol.for('levelDownInstance')];

const CHECK_PROCESS_EXCEPTION_INTERVAL = 10000;

const CHECK_PROCESS_EXCEPTION_STATE_CLOSE = 1;
const CHECK_PROCESS_EXCEPTION_STATE_CHECKING = 2;
const CHECK_PROCESS_EXCEPTION_STATE_CHECKED = 3;
const CHECK_PROCESS_EXCEPTION_STATE_ALARMED = 4;

const LEVEL_DOWM_MONITOR_STATE_KEY = 'reportMonitorState';

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

    this.fetchLastestLogsProceeding = false;
  }

  async fetchLastestLogs() {
    if (this.state === CHECK_PROCESS_EXCEPTION_STATE_CLOSE
      || this.state === CHECK_PROCESS_EXCEPTION_STATE_CHECKED
      || this.state === CHECK_PROCESS_EXCEPTION_STATE_ALARMED) {
      return;
    }

    //
    if (this.fetchLastestLogsProceeding)
    {

      logger.error(`CheckProcessExcept fetchLastestLogs, is proceeding`);

      return;
    }

    //
    this.fetchLastestLogsProceeding = true;

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
      //
      this.exceptLogs.push(`can not connect to ${this.name}, ${this.address}, ${this.host}, ${this.port}, ${this.remarks}`);

      //
      this.state = CHECK_PROCESS_EXCEPTION_STATE_CHECKED;

      //
      this.fetchLastestLogsProceeding = false;

      return;
    }

    //
    const lastestLogIndex = logs[0] ? logs[0].id : 0;

    // init localLastestLogIndex
    if (undefined === this.localLastestLogIndex) {
      this.localLastestLogIndex = lastestLogIndex
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

    //
    this.fetchLastestLogsProceeding = false;
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
    this.checkers = new Map();

    // init
    this.init().then(() => {
      logger.info(`CheckAllProcessExcept:\n${[...this.checkers.values()].map(val => `name: ${val.name}, address: ${val.address}, type: ${val.type}`).join('\n')}`)

      // 
      setInterval(this.checkProcessException.bind(this), CHECK_PROCESS_EXCEPTION_INTERVAL);

      // send a email every 7:30 am to notify every thing is ok
      this.reporterSchedule = schedule.scheduleJob('30 7 * * *', () => {
        if(!this.reportMonitorState)
        {
          return;
        }

        sendEMailAlarm({
          subject: '监控进程运行正常',
          text: [...this.checkers.values()].map(checker => {
            return `address: ${checker.address}, state: ${checker.state}`;
          }).join('\n')
        })
      });

      // send a email every 6:30 pm to notify every thing is ok
      this.reporterSchedule = schedule.scheduleJob('30 18 * * *', () => {
        if (!this.reportMonitorState) {
          return;
        }

        sendEMailAlarm({
          subject: '监控进程运行正常',
          text: [...this.checkers.values()].map(checker => {
            return `address: ${checker.address}, state: ${checker.state}`;
          }).join('\n')
        })
      });

      // notify monitor has begun
      setTimeout(() => {
        if (!this.reportMonitorState) {
          return;
        }

        sendEMailAlarm({
          subject: '监控进程开始运行',
          text: [...this.checkers.values()].map(checker => {
            return `address: ${checker.address}, state: ${checker.state}`;
          }).join('\n')
        })
      }, 20000);
    });
  }

  async init()
  {
    this.reportMonitorState = await this.getReportMonitorState();

    const nodes = await Node.findAll();
    
    //
    for (let { name, address, host, port, remarks } of nodes) {
      this.checkers.set(`${address}-ERROR`, new CheckProcessExcept({ name, address, host, port, remarks, type: 'ERROR' }));
      this.checkers.set(`${address}-FATAL`, new CheckProcessExcept({ name, address, host, port, remarks, type: 'FATAL' }));
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
    if (!checkProcessExceptErrorInstance)
    {
      throw new Error(`CheckAllProcessExcept openCheckProcessException, instance ${address}-ERROR not exist`);
    }

    // begin to monit process error exception
    if (checkProcessExceptErrorInstance.state === CHECK_PROCESS_EXCEPTION_STATE_CLOSE
      || checkProcessExceptErrorInstance.state === CHECK_PROCESS_EXCEPTION_STATE_CHECKED
      || checkProcessExceptErrorInstance.state === CHECK_PROCESS_EXCEPTION_STATE_ALARMED)
    {
      checkProcessExceptErrorInstance.reset();

      //
      checkProcessExceptErrorInstance.fetchLastestLogs();
    }

    const checkProcessExceptFatalInstance = this.checkers.get(`${address}-FATAL`);
    if (!checkProcessExceptFatalInstance) {
      throw new Error(`CheckAllProcessExcept openCheckProcessException, instance ${address}-FATAL not exist`);
    }

    // begin to monit process fatal exception
    if (checkProcessExceptFatalInstance.state === CHECK_PROCESS_EXCEPTION_STATE_CLOSE
      || checkProcessExceptFatalInstance.state === CHECK_PROCESS_EXCEPTION_STATE_CHECKED
      || checkProcessExceptFatalInstance.state === CHECK_PROCESS_EXCEPTION_STATE_ALARMED) {
      checkProcessExceptFatalInstance.reset();

      //
      checkProcessExceptFatalInstance.fetchLastestLogs();
    }
  }

  /**
   * @param {String} address
   */
  closeCheckProcessException(address)
  {
    assert(typeof address === 'string', `CheckAllProcessExcept closeCheckProcessException, address should be a String, now is ${typeof address}`);

    const checkProcessExceptErrorInstance = this.checkers.get(`${address}-ERROR`);
    if (!checkProcessExceptErrorInstance) {
      throw new Error(`CheckAllProcessExcept closeCheckProcessException, instance ${address}-ERROR not exist`);
    }
    checkProcessExceptErrorInstance.state = CHECK_PROCESS_EXCEPTION_STATE_CLOSE;


    const checkProcessExceptFatalInstance = this.checkers.get(`${address}-FATAL`);
    if (!checkProcessExceptFatalInstance) {
      throw new Error(`CheckAllProcessExcept closeCheckProcessException, instance ${address}-FATAL not exist`);
    }
    checkProcessExceptFatalInstance.state = CHECK_PROCESS_EXCEPTION_STATE_CLOSE;
  }

  async openReportMonitorState()
  {
    await new Promise((resolve, reject) => {
      levelDownInstance.put(LEVEL_DOWM_MONITOR_STATE_KEY, "ok", e => {
        if(e)
        {
          reject(e);
        }

        //
        this.reportMonitorState = true;

        resolve();
      })
    });
  }

  async closeReportMonitorState()
  {
    await new Promise((resolve, reject) => {
      levelDownInstance.del(LEVEL_DOWM_MONITOR_STATE_KEY, e => {
        if (e) {
          reject(e);
        }

        //
        this.reportMonitorState = false;

        resolve();
      })
    });
  }

  async getReportMonitorState()
  {
    return await new Promise((resolve, reject) => {
      levelDownInstance.get(LEVEL_DOWM_MONITOR_STATE_KEY,  (e, value) => {
        if (e && e.message !== "NotFound: ") {
          reject(e);
        }

        resolve(value ? true : false);
      })
    });
  }


  async checkProcessException()
  {
    const errorExceptInfo = [];
    const fatalExceptInfo = [];

    for (let [key, checkProcessExceptInstance] of this.checkers.entries()) {
      //
      if (checkProcessExceptInstance.state === CHECK_PROCESS_EXCEPTION_STATE_CLOSE
        || checkProcessExceptInstance.state === CHECK_PROCESS_EXCEPTION_STATE_CHECKED
        || checkProcessExceptInstance.state === CHECK_PROCESS_EXCEPTION_STATE_ALARMED)
      {
        continue;
      }

      //
      await checkProcessExceptInstance.fetchLastestLogs();

      // 
      if(checkProcessExceptInstance.state === CHECK_PROCESS_EXCEPTION_STATE_CHECKED)
      {
        if (key.includes('ERROR'))
        {
          errorExceptInfo.push(`name: ${checkProcessExceptInstance.name}, address: ${checkProcessExceptInstance.address}, host: ${checkProcessExceptInstance.host}, port: ${checkProcessExceptInstance.port}, remarks: ${checkProcessExceptInstance.remarks}, type: ${checkProcessExceptInstance.type}, exceptLogs: ${checkProcessExceptInstance.exceptLogs.join(";")}`);
        }

        if (key.includes('FATAL'))
        {
          fatalExceptInfo.push(`name: ${checkProcessExceptInstance.name}, address: ${checkProcessExceptInstance.address}, host: ${checkProcessExceptInstance.host}, port: ${checkProcessExceptInstance.port}, remarks: ${checkProcessExceptInstance.remarks}, type: ${checkProcessExceptInstance.type}, exceptLogs: ${checkProcessExceptInstance.exceptLogs.join(";")}`);
        }

        // close monit
        checkProcessExceptInstance.state = CHECK_PROCESS_EXCEPTION_STATE_ALARMED;
      }
    }

    if (errorExceptInfo.length > 0)
    {
      const text = errorExceptInfo.join("\n");

      logger.info(`sendEMailAlarm, ${text}`)

      sendEMailAlarm({ subject: 'EasyBc错误', text });
    }

    if(fatalExceptInfo.length > 0)
    {
      const text = fatalExceptInfo.join("\n");

      logger.info(`sendSMSAlarm, ${text}`)

      sendEMailAlarm({ subject: 'EasyBc奔溃', text });

      sendSMSAlarm({ text });
    }
  }

  /**
   * @param {String} name
   * @param {String} address
   * @param {String} host
   * @param {Number} port
   * @param {String} remarks
   */
  addMonitorNode({
      name,
      address,
			host,
			port,
			remarks,
		}) {
    assert(typeof name === 'string', `CheckAllProcessExcept addMonitorNode, name should be a String, now is ${typeof name}`);
    assert(typeof address === 'string', `CheckAllProcessExcept addMonitorNode, address should be a String, now is ${typeof address}`);
    assert(typeof host === 'string', `CheckAllProcessExcept addMonitorNode, host should be a String, now is ${typeof host}`);
    assert(typeof port === 'number', `CheckAllProcessExcept addMonitorNode, port should be a Number, now is ${typeof port}`);
    assert(typeof remarks === 'string', `CheckAllProcessExcept addMonitorNode, remarks should be a String, now is ${typeof remarks}`);

    //
    this.checkers.set(`${address}-ERROR`, new CheckProcessExcept({ name, address, host, port, remarks, type: 'ERROR' }));
    this.checkers.set(`${address}-FATAL`, new CheckProcessExcept({ name, address, host, port, remarks, type: 'FATAL' }));
  }

  /**
   * @param {String} name
   * @param {String} address
   * @param {String} host
   * @param {Number} port
   * @param {String} remarks
   */
  modifyMonitorNode({
      name,
      address,
			host,
			port,
			remarks,
		}) {
    assert(typeof name === 'string', `CheckAllProcessExcept modifyMonitorNode, name should be a String, now is ${typeof name}`);
    assert(typeof address === 'string', `CheckAllProcessExcept modifyMonitorNode, address should be a String, now is ${typeof address}`);
    assert(typeof host === 'string', `CheckAllProcessExcept modifyMonitorNode, host should be a String, now is ${typeof host}`);
    assert(typeof port === 'number', `CheckAllProcessExcept modifyMonitorNode, port should be a Number, now is ${typeof port}`);
    assert(typeof remarks === 'string', `CheckAllProcessExcept modifyMonitorNode, remarks should be a String, now is ${typeof remarks}`);

    // delete
    this.checkers.delete(`${address}-ERROR`);
    this.checkers.delete(`${address}-FATAL`);

    // add
    this.checkers.set(`${address}-ERROR`, new CheckProcessExcept({ name, address, host, port, remarks, type: 'ERROR' }));
    this.checkers.set(`${address}-FATAL`, new CheckProcessExcept({ name, address, host, port, remarks, type: 'FATAL' }));
  }

  /**
   * @param {String} name
   * @param {String} address
   * @param {String} host
   * @param {Number} port
   * @param {String} remarks
   */
  deleteMonitorNode({
      name,
      address,
			host,
			port,
			remarks
		}) {
    assert(typeof name === 'string', `CheckAllProcessExcept deleteMonitorNode, name should be a String, now is ${typeof name}`);
    assert(typeof address === 'string', `CheckAllProcessExcept deleteMonitorNode, address should be a String, now is ${typeof address}`);
    assert(typeof host === 'string', `CheckAllProcessExcept deleteMonitorNode, host should be a String, now is ${typeof host}`);
    assert(typeof port === 'number', `CheckAllProcessExcept deleteMonitorNode, port should be a Number, now is ${typeof port}`);
    assert(typeof remarks === 'string', `CheckAllProcessExcept deleteMonitorNode, remarks should be a String, now is ${typeof remarks}`);

    // delete
    this.checkers.delete(`${address}-ERROR`);
    this.checkers.delete(`${address}-FATAL`);
  }

}

module.exports = CheckAllProcessExcept;