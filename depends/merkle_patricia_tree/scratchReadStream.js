const { Readable } = require('readable-stream')

// ScratchReadStream this is used to minimally dump the scratch into the db
class ScratchReadStream extends Readable 
{
  constructor(scratch)
  {
    super({ objectMode: true })

    this.scratch = scratch
    this.next = null
  }

  _read()
  {
    if(!this._started) 
    {
      this._started = true
      this.scratch._db.createReadStream().on('data', entry => {
        this.push({
          key: entry.key,
          value: entry.value
        })
      }).on('end', () => {
        this.push(null);
      });
    }
  }
}

module.exports = ScratchReadStream;