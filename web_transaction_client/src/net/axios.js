import axios from 'axios'
import developmentConfig from '../configs/development.json'
import productionConfig from '../configs/production.json'

var host;
var port;

if(process.env.NODE_ENV === 'development')
{
  ({ host, port } = developmentConfig)
}

if(process.env.NODE_ENV === 'production')
{
  ({ host, port } = productionConfig)
}

let http = axios.create({
  baseURL: `http://${host}:${port}`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
  },
  transformRequest: [data => {
    let newData = ''
    for (let k in data) {
      if (data.hasOwnProperty(k) === true) {
        newData += encodeURIComponent(k) + '=' + encodeURIComponent(data[k]) + '&'
      }
    }
    return newData
  }]
})

function apiAxios(method, url, params, response)
{
  http({
    method: method,
    url: url,
    data: method === 'POST' || method === 'PUT' ? params : null,
    params: method === 'GET' || method === 'DELETE' ? params : null
  }).then(res => {
    if(res.status < 200 || res.status >= 300)
    {
      Vue.prototype.$notify.error({
        title: 'apiAxios',
        message: response
      });
      return;
    }
    response(res.data)
  }).catch(err => {
    response(err)
  })
}

export default {
  get: function (url, params, response) {
    return apiAxios('GET', url, params, response)
  },
  post: function (url, params, response) {
    return apiAxios('POST', url, params, response)
  },
  put: function (url, params, response) {
    return apiAxios('PUT', url, params, response)
  },
  delete: function (url, params, response) {
    return apiAxios('DELETE', url, params, response)
  }
}
