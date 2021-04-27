import fs, { promises as fsp } from 'fs';
import path from 'path';
import debug from 'debug';
import getGeneralPath from './getGeneralPath.js';
import downloadEngine from './downloader.js';
import getFiles from './extractFiles.js';

const logPageLoader = debug('page-loader:main module');

const pageLoader = (inputUrl, outputPath = process.cwd()) => {
  const localOrigin = new URL(inputUrl).origin;
  logPageLoader('incoming url', inputUrl);
  const generalPath = getGeneralPath(inputUrl, outputPath);
  const htmlFilePath = `${generalPath}.html`;
  const contentDirPath = `${generalPath}_files`;

  let downloadedHTMLContent;
  let modifiedData;
  let fileInfos;
  return downloadEngine(inputUrl)
    .then((response) => {
      logPageLoader('Response', response.status);
      if (response.status !== 200) {
        throw new Error(`Request error at ${inputUrl}. Response status is ${response.status}`);
      }
      downloadedHTMLContent = response.data;
    })
    .then(() => {
      if (fs.existsSync(contentDirPath)) {
        throw new Error(`File system error. ${contentDirPath} already exists`);
      }
      fsp.mkdir(contentDirPath);
    })
    .then(() => {
      try {
        fsp.access(contentDirPath, fs.constants.F_OK);
      } catch {
        throw new Error(`File system error. ${contentDirPath} does not exist`);
      }
    })
    .then(() => {
      try {
        fsp.access(contentDirPath, fs.constants.W_OK);
        [modifiedData, fileInfos] = getFiles(downloadedHTMLContent, contentDirPath, localOrigin);
        logPageLoader('got files info?', fileInfos.length !== 0);
        fsp.writeFile(htmlFilePath, modifiedData);
      } catch {
        throw new Error(`File system error. You have no permissions to write in ${contentDirPath}`);
      }
    })
    .then(() => {
      fileInfos.forEach(({ fullLink, fullName }) => {
        downloadEngine(fullLink, 'stream')
          .then((response) => {
            response.data.pipe(fs.createWriteStream(path.join(contentDirPath, fullName)));
          });
      });
    })
    .then(() => console.log('filepath', htmlFilePath))
    .catch((error) => {
      console.error(`${error.message}\n`);
      throw error;
    });
};

export default pageLoader;
