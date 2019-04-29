const checkCookie = require('../user/checkCookie')
const process = require('process')
const { SUCCESS, PARAM_ERR, OTH_ERR } = require('../../constant')

const app = process[Symbol.for('app')]
const models = process[Symbol.for('models')]

app.get('/nodes', checkCookie, (req, res) => {

	models.Node.findAll().then(nodes => {
		res.json({
	    code: SUCCESS,
	    data: nodes
	  })
	})
});


app.post('/addNode', checkCookie, (req, res) => {
	const name = req.body.name;
	const host = req.body.host;
	const port = req.body.port;
	const remarks = req.body.remarks;

	if(!!!name)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid name'
    })
  }

  if(!!!host)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid host'
    })
  }

  if(!!!port)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid port'
    })
  }

  if(!!!remarks)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid remarks'
    })
  }

	models.Node.findOrCreate({
		where: {
			name: name
		},
		defaults: {
			host,
			port,
			remarks
		}
	}).then(([node, created]) => {
    if(!created)
    {
      return res.json({
        code: OTH_ERR,
        msg: `node ${node.name} has existed`
      });
    }
    
    res.json({
      code: SUCCESS
    });
  });
});

app.post('/modifyNode', checkCookie, (req, res) => {
	const id = req.body.id;
	const name = req.body.name;
	const host = req.body.host;
	const port = req.body.port;
	const remarks = req.body.remarks;

	if(!!!id)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid id'
    })
  }

	if(!!!name)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid name'
    })
  }

  if(!!!host)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid host'
    })
  }

  if(!!!port)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid port'
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
  	const node = await models.Node.findOne({
	  	where: {
	  		id: id
	  	}
	  });

	  if(undefined === node)
    {
      return res.json({
        code: OTH_ERR,
        msg: 'node not exist'
      });
    }

    Object.assign(node, { name, host, port, remarks });

    await node.save();

		res.json({
      code: SUCCESS
    });
  })()
});

app.post('/deleteNode', checkCookie, (req, res) => {
	const id = req.body.id;
	
	if(!!!id)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid id'
    })
  }

 	(async () => {
  	const node = await models.Node.findOne({
	  	where: {
	  		id: id
	  	}
	  });

	  if(undefined === node)
    {
      return res.json({
        code: OTH_ERR,
        msg: 'node not exist'
      });
    }

    await node.destroy();

		res.json({
      code: SUCCESS
    });
  })()
});