import axios from 'axios';

const downloadEngine = (url, responseType = 'json') => axios({
  method: 'GET',
  url,
  responseType,
});

export default downloadEngine;
