const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy;
const { users } = require('../constant')
const cookie = require('cookie');
const { ERR_SERVER_INNER, ERR_LOGIN_FAILED } = require('../constant');
const { SUCCESS, PARAM_ERR, OTH_ERR } = require('../../constant')
const { randomBytes } = require('crypto');
const checkCookie = require('./checkCookie')
const assert = require('assert')

const app = process[Symbol.for('app')]
const cookieSet = process[Symbol.for('cookieSet')];
const models = process[Symbol.for('models')]

// password
passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
  },

  function(username, password, done) {

    models.User.findOne({
      where: {
        username: username
      }
    }).then(user => {
      if(user === undefined)
      {
        return done(null, { message: 'Incorrect username.' });
      }

      if(password !== user.password)
      {
        return done(null, { message: 'Incorrect password.' });
      }

      done(null, null)
    })
  }
));

app.get('/users', checkCookie, function(req, res) {
  models.User.findAll().then(users => {
    const formattedUsers = users.map(user => {
      return { id: user.id, username: user.username, privilege: user.privilege, remarks: user.remarks, createdAt: user.createdAt, updatedAt: user.updatedAt }
    })

    res.json({
      code: SUCCESS,
      data: formattedUsers
    });
  })
});

app.post('/addUser', checkCookie, function(req, res) {
  const username = req.body.username;
  const password = req.body.password;
  const privilege = req.body.privilege;
  const remarks = req.body.remarks;

  if(!!!username)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid username'
    })
  }

  if(!!!password)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid password'
    })
  }

  if(!!!privilege)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid privilege'
    })
  }

  if(!!!remarks)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid remarks'
    })
  }

  models.User.findOrCreate({
    where: {
      username: username
    },
    defaults: {
      password: password,
      privilege: privilege,
      remarks: remarks
    }
  }).then(([user, created]) => {
    if(!created)
    {
      return res.json({
        code: OTH_ERR,
        msg: `user ${user.username} has existed`
      });
    }
    
    res.json({
      code: SUCCESS
    });
  });
})

app.post('/modifyUser', checkCookie, function(req, res) {
  const username = req.body.username;
  const password = req.body.password;
  const privilege = req.body.privilege;
  const remarks = req.body.remarks;

  if(!!!username)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid username'
    })
  }

  if(!!!password)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid password'
    })
  }

  if(!!!privilege)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid privilege'
    })
  }

  if(!!!remarks)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid remarks'
    })
  }

  (async () => {
    const user = await models.User.findOne({where: {
      username: username
    }});

    if(undefined === user)
    {
      return res.json({
        code: OTH_ERR,
        msg: 'user not exist'
      });
    }

    if(username === 'admin' && privilege !== user.privilege)
    {
      return res.json({
        code: OTH_ERR,
        msg: 'can not modify admin\'s privilege'
      })
    }


    Object.assign(user, {password, privilege, remarks})
    await user.save();

    res.json({
      code: SUCCESS
    });
  })();  
})

app.post('/deleteUser', checkCookie, function(req, res) {
  const username = req.body.username;

  if(!!!username)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid username'
    })
  }

  (async () => {
    if(username === 'admin')
    {
      return res.json({
        code: OTH_ERR,
        msg: 'can not delete admin'
      })
    }

    const user = await models.User.findOne({where: {
      username: username
    }});

    if(undefined === user)
    {
      return res.json({
        code: OTH_ERR,
        msg: 'user not exist'
      });
    }

    await user.destroy();

    res.json({
      code: SUCCESS
    });
  })();
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