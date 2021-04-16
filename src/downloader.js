import axios from 'axios';
// eslint-disable-next-line no-unused-vars
import axiosdebuglog from 'axios-debug-log';

const downloadEngine = (url, responseType = 'json') => axios({
  method: 'GET',
  url,
  responseType,
});

export default downloadEngine;
