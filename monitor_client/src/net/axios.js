import axios from 'axios'
import { host, port } from '../config.json'

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

async function apiAxios(method, url, params)
{
  const res = await http({
    method: method,
    url: url,
    data: method === 'POST' || method === 'PUT' ? params : null,
    params: method === 'GET' || method === 'DELETE' ? params : null
  });

  if(res.status < 200 || res.status >= 300)
  {
    Vue.prototype.$notify.error({
      title: 'apiAxios',
      message: res
    });
    await Promise.reject('invalid status code');
  }
  return res.data
}

export default {
  get: async function (url, params, response) {
    return apiAxios('GET', url, params, response)
  },
  post: async function (url, params, response) {
    return apiAxios('POST', url, params, response)
  },
  put: async function (url, params, response) {
    return apiAxios('PUT', url, params, response)
  },
  delete: async function (url, params, response) {
    return apiAxios('DELETE', url, params, response)
  }
}
