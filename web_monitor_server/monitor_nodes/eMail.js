const nodemailer = require('nodemailer');

class EMail
{
  constructor({ host, user, pass})
  {
    this.host = host;
    this.user = user;
    this.pass = pass;
    this.clientIsValid = false;

    this.transporter = nodemailer.createTransport({
      host: host,//代理商，这里写的qq的
      secure: true,
      port: 465,
      auth: {
        user: user, //授权邮箱
        pass: pass // 这里密码不是qq密码，是你设置的smtp授权码
      }
    });

    this.transporter.verify((error, success) => {
      if (error) {
        this.clientIsValid = false;
        console.warn('邮件客户端初始化连接失败，将在一小时后重试');
        setTimeout(verifyClient, 1000 * 10);
      } else {
        this.clientIsValid = true;
        console.log('邮件客户端初始化连接成功，随时可发送邮件');
      }
    });
  }


  sendMail({ from = '565828928@qq.com', to = 'zsdswalker@163.com', subject = 'Message', text = 'I hope this message gets read!' }) {
    if (!this.clientIsValid) {
      console.warn('由于未初始化成功，邮件客户端发送被拒绝');
      return false;
    }

    this.transporter.sendMail({
      from,
      to,
      subject,
      text
    }, (error, info) => {
      if (error) return console.warn('邮件发送失败', error);
      console.log('邮件发送成功', info.messageId, info.response);
    });
  }
}

const qq = new EMail({
  host: 'smtp.qq.com',
  user: "565828928@qq.com",
  pass: "isciykforjpsbecc"
});

const w163 = new EMail({
  host: 'smtp.163.com',
  user: 'zsdswalker@163.com',
  pass: "123456asdfgh"
});


module.exports.sendMail = text => {
  (async () => {
    while (!w163.clientIsValid)
    {
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

module.exports.sendMail();