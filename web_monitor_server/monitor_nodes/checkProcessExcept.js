const rp = require("request-promise");
const sendSMSAlarm = require("./smsAlarm");
const sendEMailAlarm = require("./eMailAlarm");

const logger = process[Symbol.for('logger')];

const CHECK_PROCESS_EXCEPTION_INTERVAL = 10000;

const CHECK_PROCESS_EXCEPTION_STATE_CLOSE = 1;
const CHECK_PROCESS_EXCEPTION_STATE_CHECKING = 2;
const CHECK_PROCESS_EXCEPTION_STATE_CHECKED = 3;

class CheckProcessExcept
{
  constructor()
  {
    this.state = CHECK_PROCESS_EXCEPTION_STATE_CLOSE;

    setInterval(this.checkProcessException, CHECK_PROCESS_EXCEPTION_INTERVAL);
  }

  get state()
  {
    return this.state
  }

  set state(val) {
    if (val !== CHECK_PROCESS_EXCEPTION_STATE_CLOSE
      && val !== CHECK_PROCESS_EXCEPTION_STATE_OPEN) {
      throw new Error(`CheckProcessExcept set state, invalid val ${val}`)
    }

    this.state = val;
  }

  async checkProcessException() {
    if (this.state !== CHECK_PROCESS_EXCEPTION_STATE_CHECKING)
    {
      return;
    }

    //
    const nodes = Node.findAll();
    for(let node of nodes)
    {
      try {
        // check process state
        const {data} = await rp({
          method: "POST",
          uri: `${req.body.url}${req.url}`,
          body: req.body,
          json: true
        });

        if(1)
        {
          sendSMSAlarm();
          sendEMailAlarm();

          this.state = CHECK_PROCESS_EXCEPTION_STATE_CHECKED;

          break;
        }
        else
        {

        }
      }
      catch(e) {
        sendSMSAlarm();
        sendEMailAlarm();

        this.state = CHECK_PROCESS_EXCEPTION_STATE_CHECKED;
        
        break;
      }
    }
  }
}

module.exports = CheckProcessExcept;