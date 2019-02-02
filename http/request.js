var request = require("request");

module.exports.post = function(logger, url, data, cb)
{
  logger.info("new request, url: " + url + ", body: " + JSON.stringify(data));
  request({
    url: url,
    timeout: 500,
    method: "POST",
    json: true,
    headers: { "content-type": "application/json"},
    body: data
  }, function(err, response, body) { 
    if(!!err)
    {
      logger.error("request response, url: " + url + ", put request data: " + JSON.stringify(data) + ", err: " + err);
      return cb(err);
    }

    if(response.statusCode != 200)
    {
      logger.error("request response, url: " + url + ", put request data: " + JSON.stringify(data) + ", status code: " + response.statusCode);
      return cb("network err, statusCode: " + response.statusCode);
    }

    logger.info("request response, url: " + url + ", put request data: " + JSON.stringify(data) + ", put response data: " + JSON.stringify(body));
    cb(null, body);
  }); 
}
