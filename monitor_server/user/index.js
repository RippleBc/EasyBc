const process = require('process')
const password = require('password')
const LocalStrategy = require('passport-local').Strategy;
const { getUser } = require('../../common/constant')
const cookie = require('cookie');
const { ERR_SERVER_INNER, ERR_LOGIN_FAILED, SUCCESS } = require('../constant');

const app = process[Symbol.for('app')]
const cookieSet = process[Symbol.for('cookieSet')];

// password
passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
  },

  function(username, password, done) {
    const user = getUser(username);

    if(user === undefined)
    {
      return done(null, { message: 'Incorrect username.' });
    }

    if(password !== user.password)
    {
      return done(null, { message: 'Incorrect password.' });
    }

    return done(null, null)
  }
));

app.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, info) {
    if (err) 
    { 
      return res.json({
        code: ERR_SERVER_INNER,
        msg: `login failed, inner err, ${err}`
      });
    }

    if(info)
    {
      return res.json({
        code: ERR_LOGIN_FAILED,
        msg: `login failed, ${info.message}`
      });
    }

    const sid = keccak256(stringToBuffer(USER + PASSWORD + Date.now())).toString("hex")

    // Set a new cookie with the name
    res.setHeader('Set-Cookie', cookie.serialize("sid", process.sid, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7 // 1 week
    }));

    //
    res.json({
      code: SUCCESS,
      msg: ""
    });

  })(req, res, next);
});