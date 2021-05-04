import fs, { promises as fsp } from 'fs';
import path from 'path';
import debug from 'debug';
import Listr from 'listr';
import getGeneralPath from './getGeneralPath.js';
import downloadEngine from './downloader.js';
import getFiles from './getFilesInfo.js';

const logPageLoader = debug('page-loader:main module');

const pageLoader = (inputUrl, outputPath = process.cwd()) => {
  const localOrigin = new URL(inputUrl).origin;
  logPageLoader('incoming url', inputUrl);
  const generalPath = getGeneralPath(inputUrl, outputPath);
  const htmlFilePath = `${generalPath}.html`;
  const contentDirPath = `${generalPath}_files`;
  logPageLoader([generalPath, htmlFilePath, contentDirPath]);

  let downloadedHTMLContent;
  let modifiedData;
  let fileInfos;

  return downloadEngine(inputUrl)
    .then((response) => {
      logPageLoader('Response', response.status);
      downloadedHTMLContent = response.data;
    })
    .then(() => {
      if (fs.existsSync(contentDirPath)) {
        throw new Error(`File system error. ${contentDirPath} already exists`);
      }
    })
    .then(() => fsp.mkdir(contentDirPath))
    .then(() => {
      fsp.access(contentDirPath, fs.constants.F_OK)
        .catch(() => {
          throw new Error(`File system error. ${contentDirPath} does not exist`);
        });
    })
    .then(() => {
      fsp.access(contentDirPath, fs.constants.W_OK)
        .catch(() => {
          throw new Error(`File system error. You have no permissions to write in ${contentDirPath}`);
        });
    })
    .then(() => {
      [modifiedData, fileInfos] = getFiles(downloadedHTMLContent, contentDirPath, localOrigin);
      logPageLoader(fileInfos);
      logPageLoader('got files info?', fileInfos.length !== 0);
      fsp.writeFile(htmlFilePath, modifiedData);
    })
    .then(() => {
      const tasks = fileInfos.map(({ fullLink, fullName }) => ({
        title: fullLink,
        task: () => downloadEngine(fullLink, 'arraybuffer')
          .then((response) => fsp.writeFile(path.join(contentDirPath, fullName), response.data)),
      }));
      logPageLoader('tasks', tasks);
      const list = new Listr(tasks, { concurrent: true });
      return list.run();
    })
    .then(() => htmlFilePath);
};

export default pageLoader;
