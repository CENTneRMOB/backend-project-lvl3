import axios from 'axios';
// eslint-disable-next-line no-unused-vars
import axiosdebuglog from 'axios-debug-log';

const downloadEngine = (url, responseType) => axios({
  method: 'GET',
  url,
  responseType,
}).catch((error) => {
  throw new Error(`Request error at ${url}. ${error.message}`);
});

export default downloadEngine;
