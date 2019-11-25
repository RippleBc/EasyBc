// 必须引入crypto
const crypto = require('crypto');
const rp = require("request-promise");
const urlencode = require('urlencode');

const logger = process[Symbol.for('logger')];

const SMS_USERID = "100020";
const SMS_APIKEY = "bdfd413e43a443b48046e8344b05d7ca";

class SMSAlarm {
    constructor() {

    }

    /**
     * @param {String} mobile
     * @param {String} content
     */
    sendSms({mobile = "18605807725", content}) {
        const ts = Date.now();
        const sign = crypto.createHash('md5').update(`${SMS_USERID}${ts}${SMS_APIKEY}`).digest('hex');

        const url = `http://118.31.170.102:8081/api/sms/send?userid=${SMS_USERID}&ts=${ts}&sign=${sign}&mobile=${mobile}&msgcontent=${urlencode(content)}&time=&extnum=`;

        console.warn(url);

        rp({
            method: "GET",
            uri: url
        }).then(response => {
            console.log(response)
        }).catch(e => {
            console.log(e);
        });
    }

}

module.exports = SMSAlarm;


const testInstantce = new SMSAlarm();

testInstantce.sendSms({content: "[我能] 123456789"});