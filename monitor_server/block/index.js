const checkCookie = require('../user/checkCookie')
const process = require('process')
const { SUCCESS, PARAM_ERR, OTH_ERR } = require('../../constant')

const app = process[Symbol.for('app')]

app.get('/blocks', checkCookie, (req, res) => {
	res.json({
		code: SUCCESS,
		data:[{
        hash: '区块',
        number: '1',
        timestamp: '2018-04-12 20:46'
    }, {
        hash: '区块',
        number: '2',
        timestamp: '2018-04-12 20:46'
    }, {
        hash: '区块',
        number: '3',
        timestamp: '2018-04-12 20:46'
    }, {
        hash: '区块',
        number: '4',
        timestamp: '2018-04-12 20:46'
    }
	]})
});