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
     * @param {String} text
     */
    sendSms({mobile = "18605807725", text}) {
        const ts = Date.now();
        const sign = crypto.createHash('md5').update(`${SMS_USERID}${ts}${SMS_APIKEY}`).digest('hex');

        const url = `http://118.31.170.102:8081/api/sms/send?userid=${SMS_USERID}&ts=${ts}&sign=${sign}&mobile=${mobile}&msgcontent=${"%e3%80%90"}${urlencode("我能")}${"%e3%80%91"}${urlencode(text)}&time=&extnum=`;

        logger.warn(url);

        rp({
            method: "GET",
            uri: url
        }).then(response => {
            logger.info(response)
        }).catch(e => {
            logger.error(e);
        });
    }

}

const smsInstance = new SMSAlarm();

module.exports = ({ mobile, text }) => {
    smsInstance.sendSms({ mobile, text });
}



