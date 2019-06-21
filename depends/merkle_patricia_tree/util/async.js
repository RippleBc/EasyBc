const async = require('async')
const assert =require("assert")

module.exports.callTogether = function() 
{
  let funcs = arguments
  let length = funcs.length
  let index = length

  if(!length) 
  {
    return function() {}
  }

  return function() {
    while(index--)
    {
      let fn = funcs[index]
      if(typeof fn !== 'function') 
      {
        throw Error(`async callTogether, arguments should be function, now is ${typeof fn}`)
      }
      funcs[index].apply(this, arguments)
    }
  }
}

/**
 * Take a collection of async fns, call the cb on the first to return a truthy value.
 * If all run without a truthy result, return undefined
 */
module.exports.asyncFirstSeries = function(array, iterator, cb)
{
  assert(Array.isArray(array), `async asyncFirstSeries, array should be an Array, now is ${typeof array}`)
  assert(typeof iterator === 'function', `async asyncFirstSeries, iterator should be a Function, now is ${typeof iterator}`)

  var didComplete = false
  async.eachSeries(array, (item, next) => {
    if(didComplete) 
    {
      return next()
    }

    iterator(item, (err, result) => {
      if(result)
      {
        didComplete = true

        process.nextTick(cb.bind(null, null, result))
      }
      next(err)
    })
  }, () => {
    if(!didComplete)
    {
      cb()
    }
  })
}
