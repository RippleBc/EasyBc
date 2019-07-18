const checkCookie = require('../user/checkCookie')
const { SUCCESS, PARAM_ERR, OTH_ERR } = require('../../constant')
const rp = require("request-promise");
const assert = require("assert");

const app = process[Symbol.for('app')]
const { Node, Cpu, Memory } = process[Symbol.for('models')]
const logger = process[Symbol.for('logger')];
const printErrorStack = process[Symbol.for("printErrorStack")]

app.get('/monitorNodes', checkCookie, (req, res) => {
	Node.findAll().then(nodes => {
		res.json({
	    code: SUCCESS,
	    data: nodes
	  })
	}).catch(e => {
    printErrorStack(e)

    res.json({
      code: OTH_ERR,
      msg: e.toString()
    })
  })
});

app.post('/addMonitorNode', checkCookie, (req, res) => {
	const name = req.body.name;
  const address = req.body.address;
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

  if(!!!address)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid address'
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

	Node.findOrCreate({
		where: {
			address: address
		},
		defaults: {
      name,
      address,
			host,
			port,
			remarks
		}
	}).then(([node, created]) => {
    if(!created)
    {
      return res.json({
        code: OTH_ERR,
        msg: `node ${node.address} has existed`
      });
    }
    
    res.json({
      code: SUCCESS
    });
  }).catch(e => {
    printErrorStack(e)

    res.json({
      code: OTH_ERR,
      msg: e.toString()
    })
  })
});

app.post('/modifyMonitorNode', checkCookie, (req, res) => {
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
  	const node = await Node.findOne({
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
  })().catch(e => {
    printErrorStack(e)

    res.json({
      code: OTH_ERR,
      msg: e.toString()
    })
  })
});

app.post('/deleteMonitorNode', checkCookie, (req, res) => {
	const id = req.body.id;
	
	if(!!!id)
  {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid id'
    })
  }

 	(async () => {
  	const node = await Node.findOne({
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
  })().catch(e => {
    printErrorStack(e)

    res.json({
      code: OTH_ERR,
      msg: e.toString()
    })
  })
});

app.get('/logs', checkCookie, (req, res) => {
  const url = req.query.url;
  let offset = req.query.offset;
  let limit = req.query.limit;
  const type = req.query.type;
  const title = req.query.title;
  const beginTime = req.query.beginTime;
  const endTime = req.query.endTime;

  assert(typeof url === 'string', `url should be a String, now is ${typeof url}`);
  assert(typeof type === 'string', `type should be a String, now is ${typeof type}`);
  assert(/^\d+$/.test(offset), `offset should be a Number, now is ${typeof offset}`);
  assert(/^\d+$/.test(limit), `limit should be a Number, now is ${typeof limit}`);

  offset = parseInt(offset)
  limit = parseInt(limit);

  (async function() {
    let options = {
      method: "POST",
      uri: `${url}/logs`,
      body: {
        type: type,
        offset: offset,
        limit: limit
      },
      json: true // Automatically stringifies the body to JSON
    };

    if(title)
    {
      options.body.title = title;
    }
    if(beginTime)
    {
      assert(/^\d+$/.test(beginTime), `beginTime should be a Number, now is ${typeof beginTime}`)
      options.body.beginTime = parseInt(beginTime);
    }
    if(endTime)
    {
      assert(/^\d+$/.test(endTime), `endTime should be a Number, now is ${typeof endTime}`)
      options.body.endTime = parseInt(endTime);
    }

    const response = await rp(options);

    if(response.code !== SUCCESS)
    {
        await Promise.reject(response.msg) 
    }

    return response.data;
  })().then(results => {
    res.json({
      code: SUCCESS,
      data: results
    })
  }).catch(e => {
    printErrorStack(e);

    res.json({
      code: OTH_ERR,
      msg: e.toString()
    })
  });
});


app.get('/timeConsume', checkCookie, (req, res) => {
  const url = req.query.url;
  let offset = req.query.offset;
  let limit = req.query.limit;
  const type = req.query.type;
  const stage = req.query.stage;
  const beginTime = req.query.beginTime;
  const endTime = req.query.endTime;

  assert(typeof url === 'string', `url should be a String, now is ${typeof url}`);
  assert(/^\d+$/.test(offset), `offset should be a Number, now is ${typeof offset}`)
  assert(/^\d+$/.test(limit), `limit should be a Number, now is ${typeof limit}`);

  offset = parseInt(offset);
  limit = parseInt(limit);

  (async function() {
    let options = {
      method: "POST",
      uri: `${url}/timeConsume`,
      body: {
        offset: offset,
        limit: limit
      },
      json: true // Automatically stringifies the body to JSON
    };

    if(type)
    {
      assert(/^\d+$/.test(type), `type should be a Number, now is ${typeof type}`)
      options.body.type = parseInt(type);
    }
    if(stage)
    {
      assert(/^\d+$/.test(stage), `stage should be a Number, now is ${typeof stage}`)
      options.body.stage = parseInt(stage);
    }
    if(beginTime)
    {
      assert(/^\d+$/.test(beginTime), `beginTime should be a Number, now is ${typeof beginTime}`)
      options.body.beginTime = parseInt(beginTime);
    }
    if(endTime)
    {
      assert(/^\d+$/.test(endTime), `endTime should be a Number, now is ${typeof endTime}`)
      options.body.endTime = parseInt(endTime);
    }

    const response = await rp(options);

    if(response.code !== SUCCESS)
    {
        await Promise.reject(response.msg) 
    }

    return response.data;
  })().then(results => {
    res.json({
      code: SUCCESS,
      data: results
    })
  }).catch(e => {
    printErrorStack(e)

    res.json({
      code: OTH_ERR,
      msg: e.toString()
    })
  });
});

app.get('/abnormalNodes', checkCookie, (req, res) => {
  const url = req.query.url;
  let offset = req.query.offset;
  let limit = req.query.limit;
  const type = req.query.type;
  const beginTime = req.query.beginTime;
  const endTime = req.query.endTime;

  assert(typeof url === 'string', `url should be a String, now is ${typeof url}`);
  assert(/^\d+$/.test(offset), `offset should be a Number, now is ${typeof offset}`)
  assert(/^\d+$/.test(limit), `limit should be a Number, now is ${typeof limit}`);

  offset = parseInt(offset);
  limit = parseInt(limit);

  (async function() {
    let options = {
      method: "POST",
      uri: `${url}/abnormalNodes`,
      body: {
        offset: offset,
        limit: limit
      },
      json: true // Automatically stringifies the body to JSON
    };

    if(type)
    {
      assert(/^\d+$/.test(type), `type should be a Number, now is ${typeof type}`)
      options.body.type = parseInt(type);
    }
    if(beginTime)
    {
      assert(/^\d+$/.test(beginTime), `beginTime should be a Number, now is ${typeof beginTime}`)
      options.body.beginTime = parseInt(beginTime);
    }
    if(endTime)
    {
      assert(/^\d+$/.test(endTime), `endTime should be a Number, now is ${typeof endTime}`)
      options.body.endTime = parseInt(endTime);
    }
    
    const response = await rp(options);

    if(response.code !== SUCCESS)
    {
      await Promise.reject(response.msg) 
    }

    return response.data;
  })().then(results => {
    res.json({
      code: SUCCESS,
      data: results
    })
  }).catch(e => {
    printErrorStack(e)

    res.json({
      code: OTH_ERR,
      msg: e.toString()
    })
  });
});