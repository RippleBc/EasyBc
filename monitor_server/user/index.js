const process = require('process')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy;
const { users } = require('../constant')
const cookie = require('cookie');
const { ERR_SERVER_INNER, ERR_LOGIN_FAILED } = require('../constant');
const { SUCCESS, PARAM_ERR, OTH_ERR } = require('../../constant')
const { randomBytes } = require('crypto');
const { checkCookie } = require('./checkCookie')
const app = process[Symbol.for('app')]
const cookieSet = process[Symbol.for('cookieSet')];

/*
 * @return {Object|undefined}
 */
const getUser = username => users.find(user => user.username === username);
const getUserIndex = username => users.findIndex(user => user.username === username);

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

app.get('/users', function(req, res) {

  const formattedUsers = users.map(user => {
    return { username: user.username, privilege: user.privilege, remarks: user.remarks }
  })

  res.json({
    code: SUCCESS,
    data: formattedUsers
  });
});

app.post('/addUser', function(req, res) {
  const username = req.body.username;
  const password = req.body.password;
  const privilege = req.body.privilege;
  const remarks = req.body.remarks;

  if(getUserIndex(username) >= 0)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'user has existed'
    })
  }

  users.push({username, password, privilege, remarks});

  res.json({
    code: SUCCESS
  });
})

app.post('/modifyUser', function(req, res) {
  const username = req.body.username;
  const password = req.body.password;
  const privilege = req.body.privilege;
  const remarks = req.body.remarks;

  const index = getUserIndex(username)

  if(username === 'admin' && privilege !== users[index].privilege)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'can not modify admin\'s privilege'
    })
  }

  if(index < 0)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'user not exist'
    });
  }

  users[index] = {username, password, privilege, remarks}

  res.json({
    code: SUCCESS
  });
})

app.post('/deleteUser', function(req, res) {
  const username = req.body.username;
  const password = req.body.password;
  const privilege = req.body.privilege;
  const remarks = req.body.remarks;

  if(username === 'admin')
  {
    return res.json({
      code: OTH_ERR,
      msg: 'can not delete admin'
    })
  }

  const index = getUserIndex(username)
  if(index < 0)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'user not exist'
    });
  }

  users.splice(index, 1);

  res.json({
    code: SUCCESS
  });
})

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

    const sid = randomBytes(32).toString("hex");

    // record sid
    cookieSet.add(sid);

    // Set a new cookie with the name
    res.setHeader('Set-Cookie', cookie.serialize("sid", sid, {
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