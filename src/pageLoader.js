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
      downloadedHTMLContent = response.data;
    })
    .then(() => fsp.mkdir(contentDirPath))
    // .then(() => getFiles(downloadedHTMLContent, contentDirPath, localOrigin))
    .then(() => {
      [modifiedData, fileInfos] = getFiles(downloadedHTMLContent, contentDirPath, localOrigin);
      logPageLoader('got files info?', fileInfos.length !== 0);
      fsp.writeFile(htmlFilePath, modifiedData);
    })
    .then(() => {
      fileInfos.forEach(({ fullLink, fullName }) => {
        downloadEngine(fullLink, 'stream')
          .then((response) => response.data.pipe(
            fs.createWriteStream(path.join(contentDirPath, fullName)),
          ));
      });
    })
    .then(() => console.log(htmlFilePath));
};

export default pageLoader;
