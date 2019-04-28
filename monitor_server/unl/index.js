const checkCookie = require('../user/checkCookie')
const process = require('process')
const { unl } = require('../constant');
const { SUCCESS, PARAM_ERR, OTH_ERR } = require('../../constant')

const app = process[Symbol.for('app')]

app.get('/unl', checkCookie, (req, res) => {
	res.json({
    code: SUCCESS,
    data: unl
  })
});