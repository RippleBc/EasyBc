const nodemailer = require('nodemailer');

const logger = process[Symbol.for("logger")];

class EMailAlarm {
  constructor({ host, user, pass }) {
    this.host = host;
    this.user = user;
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
        logger.warn(`${this.host}, ${this.user}, 邮件客户端初始化连接失败，将在10s后重试`);
        setTimeout(this.verifyClient.bind(this), 1000 * 10);
      } else {
        this.clientIsValid = true;
        logger.info(`${this.host}, ${this.user}, 邮件客户端初始化连接成功，随时可发送邮件`);
      }
    });
  }

  sendMail({ from = '565828928@qq.com', to = 'zsdswalker@163.com', subject = 'Message', text = 'I hope this message gets read!' }) {
    if (!this.clientIsValid) {
      logger.warn(`${this.host}, ${this.user}, 由于未初始化成功，邮件客户端发送被拒绝`);
      return false;
    }

    this.transporter.sendMail({
      from,
      to,
      subject,
      text
    }, (error, info) => {
      if (error) return logger.warn('${this.host}, ${this.user}, 邮件发送失败', error);
      logger.info('${this.host}, ${this.user}, 邮件发送成功', info.messageId, info.response);
    });
  }
}

const qq = new EMailAlarm({
  host: 'smtp.qq.com',
  user: "565828928@qq.com",
  pass: "isciykforjpsbecc"
});

const w163 = new EMailAlarm({
  host: 'smtp.163.com',
  user: 'zsdswalker@163.com',
  pass: "123456asdfgh"
});


module.exports = ({ text }) => {
  (async () => {
    while (!w163.clientIsValid) {
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 1000)
      })
    }

    w163.sendMail({
      from: 'zsdswalker@163.com',
      to: "565828928@qq.com",
      text
    });
  })();

  (async () => {
    while (!qq.clientIsValid) {
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 1000)
      })
    }

    qq.sendMail({
      from: "565828928@qq.com",
      to: 'zsdswalker@163.com',
      text
    })
  })();
};