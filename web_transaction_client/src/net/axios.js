import axiosProducer from '../../../web_depends/axios'
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

const axiosInstance = axiosProducer(host, port)

export default axiosInstance
