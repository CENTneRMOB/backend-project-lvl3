import axios from 'axios';
import { promises as fsp } from 'fs';
import getFullPathOfDownloadedFile from './getFullPathOfDownloadedFile.js';

const pageLoader = (inputUrl, outputPath = process.cwd()) => {
  const pathForDownloadedContent = getFullPathOfDownloadedFile(inputUrl, outputPath);
  let downloadedContent;
  return axios.get(inputUrl)
    .then((response) => {
      downloadedContent = response.data;
    })
    .then(() => fsp.writeFile(pathForDownloadedContent, downloadedContent))
    .then(() => console.log(pathForDownloadedContent));
};

export default pageLoader;
