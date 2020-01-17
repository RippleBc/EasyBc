const nodemailer = require('nodemailer');
const emailConfig = require("../config.json").alarm.email;

const logger = process[Symbol.for("logger")];

class EMailAlarm {
  constructor({ host, user, from, to, pass }) {
    this.host = host;
    this.user = user;

    this.from = from;
    this.to = to;

    this.pass = pass;

    this.clientIsValid = false;
    
    this.transporter = nodemailer.createTransport({
      host: host,
      secure: true,
      port: 465,
      auth: {
        user: user,
        pass: pass
      }
    });

    this.verifyClient();
  }

  verifyClient() {
    this.transporter.verify((error, success) => {
      if (error) {
        this.clientIsValid = false;

        logger.warn(`${this.host}, ${this.user}, 邮件客户端校验成功失败，将在10s后重试`);

        setTimeout(this.verifyClient.bind(this), 1000 * 10);
      } else {
        this.clientIsValid = true;

        logger.info(`${this.host}, ${this.user}, 邮件客户端校验成功成功，随时可发送邮件`);
      }
    });
  }

  sendMail({ subject = 'Message', text = 'I hope this message gets read!' }) {
    if (!this.clientIsValid) {
      logger.warn(`${this.host}, ${this.user}, 由于未初始化成功，邮件客户端发送被拒绝`);

      return false;
    }

    this.transporter.sendMail({
      from: this.from,
      to: this.to,
      subject,
      text
    }, (error, info) => {
      if (error) 
      {
        return logger.warn(`${this.host}, ${this.user}, 邮件发送失败`, error);
      }

      logger.info(`${this.host}, ${this.user}, 邮件发送成功`, info.messageId, info.response);
    });
  }
}

//
let emailAlarmInstanceArray = [];
for(let config of emailConfig)
{
  emailAlarmInstanceArray.push(new EMailAlarm(config));
}

module.exports = ({ subject, text }) => {
  (async () => {
    for (let alarmInstance of emailAlarmInstanceArray)
    {
      while (!alarmInstance.clientIsValid) {
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve();
          }, 1000)
        })
      }

      alarmInstance.sendMail({
        subject,
        text
      });
    }
  })();
};