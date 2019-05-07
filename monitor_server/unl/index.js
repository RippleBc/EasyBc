const checkCookie = require('../user/checkCookie')
const process = require('process')
const { SUCCESS, PARAM_ERR, OTH_ERR } = require('../../constant')
const rp = require("request-promise");
const assert = require("assert");

const app = process[Symbol.for('app')]
const models = process[Symbol.for('models')]
const logger = process[Symbol.for('logger')];

models.Node.findAll().then(nodes => {
  setInterval(() => {
    for(let node of nodes.values())
    {
      let options = {
        method: "GET",
        uri: `${node.host}:${node.port}/status`,
        json: true // Automatically stringifies the body to JSON
      };

      (async function() {
        const response = await rp(options);

        if(response.code !== SUCCESS)
        {
            await Promise.reject(response.data.msg) 
        }
        logger.info(node.address + ', ' + response.data.cpu)

        await models.Cpu.create({address: node.address, consume: response.data.cpu});
        await models.Memory.create({address: node.address, consume: response.data.memory});
      })().then(() => {
        logger.info(`get cpu and memory success`);
      }).catch(e => {
        logger.error(`get cpu and memory throw exception, ${e}`);
      });
    }
  }, 5000);
})

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

app.get('/nodeStatus', checkCookie, (req, res) => {

  const address = req.query.address;

  (async function(){
    const cpus = await models.Cpu.findAll({
      limit: 10,
      order: [['id', 'DESC']],
      where: {
        address: address
      }
    });

    const memories = await models.Memory.findAll({
      limit: 10,
      order: [['id', 'DESC']],
      where: {
        address: address
      }
    });

    return { cpus, memories };
  })().then(({ cpus, memories }) => {
    res.json({
      code: SUCCESS,
      data: { cpus, memories }
    });
  }).catch(e => {
    res.json({
      code: PARAM_ERR,
      msg: e
    });
  });
});