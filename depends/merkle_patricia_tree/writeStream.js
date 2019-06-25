var Writable = require('readable-stream').Writable

var defaultOptions = { type: 'put' }

class WriteStream extends Writable
{
	constructor(db, options = {})
	{
		super({
			objectMode: true,
			highWaterMark: options.highWaterMark || 16
	  })

		options = Object.assign(options, defaultOptions)

		this._options = options
		this._db = db
		this._buffer = []
		this._flushing = false
		this._maxBufferLength = options.maxBufferLength || Infinity

		this.on('finish', () => {
			this.emit('close')
	  })
	}

	_write(data, enc, next) 
	{
	  if(this.destroyed) 
  	{
  		return
  	}

	  if(!this._flushing) 
	  {
	    this._flushing = true

	    process.nextTick(() => { 
	    	this._flush() 
	    })
	  }

	  if(this._buffer.length >= this._maxBufferLength)
	  {
	  	// 注册一次性监听器，触发后立刻删除
	    this.once('_flush', err => {

	    	// buffer中数据过多，等待buffer中全部被处理，再写入Buffer
	      if(err) 
	      {
	      	return this.destroy(err)
	      }

	      this._write(data, enc, next)
	    })
	  } 
	  else 
	  {
	  	// 数据优先写入Buffer
			Object.assign(data, { 
				type: this._options.type 
			})

			this._buffer.push(data)
			next()
	  }
	}

	_flush() 
	{
	  let buffer = this._buffer

	  if(this.destroyed) 
	  {
	  	return
	  }

	  this._buffer = []
	  this._db.batch(buffer, err => {
	    this._flushing = false

	    if(!this.emit('_flush', err) && err) 
	    {
	      // 没有对_flush事件的监听器，并且batch操作出错
	      this.destroy(err)
	    }
	  })
	}

	// 该方法会在流关闭之前被调用，且在cb被调用后触发finish事件。
	// 主要用于在流结束之前关闭资源或写入缓冲的数据（这期间不会有新的数据被写入缓冲区）
	_final(cb)
	{
	  if(this._flushing) 
	  {
	    // 等待缓冲区中数据处理完毕（正在处理缓冲区中的数据）
	    this.once('_flush', err => {
	      if(err) 
	      {
	      	return cb(err)
	      }
 
	      // 由于缓冲区数据处理是异步操作，写入期间可能有新的数据被写入缓冲区
	      this._final(cb)
	    })
	  } 
	  else if(this._buffer && this._buffer.length) 
	  {
	    this.once('_flush', cb)

	    // 缓冲区中依然有残留的数据，处理完缓冲区中的数据
	    this._flush()
	  } 
	  else 
	  {
	    cb()
	  }
	}

	_destroy(err, cb) 
	{
	  this._buffer = null
	  cb(err)
	}
}



module.exports = (db, options) => {
	return new WriteStream(db, options)
}