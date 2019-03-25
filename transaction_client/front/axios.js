import axios from "axios";

let http = axios.create({
  baseURL: "http://localhost:9090/",
  withCredentials: true,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
  },
  // transformRequest allows changes to the request data before it is sent to the server
  // This is only applicable for request methods PUT, POST, and PATCH
  // The last function in the array must return a string or an instance of Buffer, ArrayBuffer,
  // FormData or Stream
  // You may modify the headers object.
  transformRequest: [function(data) {
    let newData = "";
    for(let k in data)
    {
      if(data.hasOwnProperty(k) === true)
      {
        newData += encodeURIComponent(k) + "=" + encodeURIComponent(data[k]) + "&";
      }
    }
    return newData;
  }]
});

function apiAxios(method, url, params, response)
{
  http({
    method: method,
    url: url,
    data: method === "POST" || method === "PUT" ? params : null,
    params: method === "GET" || method === "DELETE" ? params : null,
  }).then(function(res) {
    response(res);
  }).catch(function(err) {
    response(err);
  });
}

export default {
  get: function(url, params, response)
  {
    return apiAxios("GET", url, params, response)
  },
  post: function(url, params, response)
  {
    return apiAxios("POST", url, params, response)
  },
  put: function(url, params, response)
  {
    return apiAxios("PUT", url, params, response)
  },
  delete: function(url, params, response)
  {
    return apiAxios("DELETE", url, params, response)
  }
}