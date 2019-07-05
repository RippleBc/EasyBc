const cookie = require('cookie');
const { ERR_COOKIE_INVALID } = require('../constant')

const cookieSet = process[Symbol.for('cookieSet')];

module.exports = function (req, res, next) {
  // Parse the cookieData on the request
  var cookieData = cookie.parse(req.headers.cookie || '');

  // Get the visitor sid set in the cookie
  var sid = cookieData.sid;

  if(sid && cookieSet.has(sid))
  {
    return next();
  }

  res.json({
    code: ERR_COOKIE_INVALID,
    msg: "invalid cookie, please login again"
  })
}