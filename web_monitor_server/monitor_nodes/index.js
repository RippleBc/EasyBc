const { SUCCESS, PARAM_ERR, OTH_ERR } = require('../../constant')
const rp = require("request-promise");
const assert = require("assert");
const CheckProcessExcept = require("./checkProcessExcept");

const app = process[Symbol.for('app')]
const { Node } = process[Symbol.for('models')]
const logger = process[Symbol.for('logger')];
const printErrorStack = process[Symbol.for("printErrorStack")]

const checkProcessExcept = new CheckProcessExcept()

app.post('/openReportMonitorState', (req, res) => {
  checkProcessExcept.openReportMonitorState().then(() => {
    res.json({
      code: SUCCESS
    })
  }).catch(e => {
    res.json({
      code: OTH_ERR,
      msg: e
    })
  })
});

app.post('/closeReportMonitorState', (req, res) => {
  checkProcessExcept.closeReportMonitorState().then(() => {
    res.json({
      code: SUCCESS
    })
  }).catch(e => {
    res.json({
      code: OTH_ERR,
      msg: e
    })
  })
});

app.post('/getReportMonitorState', (req, res) => {
  checkProcessExcept.getReportMonitorState().then(state => {
    res.json({
      code: SUCCESS,
      data: state
    })
  }).catch(e => {
    res.json({
      code: OTH_ERR,
      msg: e
    })
  })
});

app.post('/fetchCheckProcessExceptionState', (req, res) => {
  const address = req.body.address;

  if (!!!address) {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid address'
    });
  }

  res.json({
    code: SUCCESS,
    data: checkProcessExcept.getState(address)
  });
});

app.post('/openCheckProcessException', (req, res) => {
  const address = req.body.address;

  if (!!!address) {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid address'
    });
  }

  checkProcessExcept.openCheckProcessException(address);

  res.json({
    code: SUCCESS
  });
});

app.post('/closeCheckProcessException', (req, res) => {
  const address = req.body.address;

  if (!!!address) {
    return res.json({
      code: OTH_ERR,
      msg: 'invalid address'
    });
  }

  checkProcessExcept.closeCheckProcessException(address);

  res.json({
    code: SUCCESS
  });
});

app.post('/monitorNodes', (req, res) => {
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

app.post('/addMonitorNode', (req, res) => {
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

app.post('/modifyMonitorNode', (req, res) => {
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

app.post('/deleteMonitorNode', (req, res) => {
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

app.use((req, res, next) => {
  if (req.url.includes("logs")
    || req.url.includes("abnormalNodes"))
  { 
    if (!req.body.url) {
      return res.send({
        code: PARAM_ERR,
        msg: "param error, need url"
      });
    }
    
    const options = {
      method: "POST",
      uri: `${req.body.url}${req.url}`,
      body: req.body,
      json: true
    };

    // retransmit data
    rp(options).then(response => {
      res.json({
        code: response.code,
        data: response.data,
        msg: response.msg
      })
    }).catch(e => {
      printErrorStack(e);

      res.json({
        code: OTH_ERR,
        msg: e.toString()
      })
    });
  }
  else 
  {
    next()
  }
})