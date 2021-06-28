import fs, { promises as fsp } from 'fs';
import path from 'path';
import debug from 'debug';
import Listr from 'listr';
import slugifyUrl from './slugifyUrl.js';
import downloadEngine from './downloader.js';
import getSources from './getSources.js';

const logPageLoader = debug('page-loader');

const isExists = (dirPath) => fsp.stat(dirPath)
  .then((stats) => stats !== false)
  .catch(() => false);

const isDirectory = (dirPath) => fsp.stat(dirPath).then((stats) => stats.isDirectory());

const loadWebPage = (inputUrl, outputPath = process.cwd()) => {
  const urlObj = new URL(inputUrl);
  logPageLoader('incoming url', inputUrl);
  const slugifiedUrl = slugifyUrl(urlObj);
  const generalPath = path.resolve(outputPath, slugifiedUrl);
  const htmlFilePath = `${generalPath}.html`;
  const contentDirPath = `${generalPath}_files`;
  logPageLoader([generalPath, htmlFilePath, contentDirPath]);

  return isExists(outputPath)
    .then((isExistsAnswer) => {
      if (isExistsAnswer) {
        return isDirectory(outputPath)
          .then((isDirAnswer) => {
            if (!isDirAnswer) {
              throw new Error(`File system error. ${outputPath} is not a directory`);
            }

            return fsp.access(outputPath, fs.constants.W_OK)
              .catch(() => {
                throw new Error(`File system error. You have no permissions to write in ${outputPath}`);
              });
          });
      }

      throw new Error(`File system error. ${outputPath} does not exist`);
    })
    .then(() => fsp.mkdir(contentDirPath))
    .then(() => isExists(contentDirPath)
      .then((answer) => {
        if (!answer) {
          throw new Error(`File system error. ${contentDirPath} does not exist`);
        }
      }))
    .then(() => downloadEngine(inputUrl))
    .then((response) => {
      logPageLoader('Response', response.status);
      return response.data;
    })
    .then((data) => {
      const [modifiedHtml, sourcesInfo] = getSources(data, contentDirPath, urlObj.origin);
      logPageLoader(sourcesInfo);
      return fsp.writeFile(htmlFilePath, modifiedHtml).then(() => sourcesInfo);
    })
    .then((sourcesInfo) => {
      const tasks = sourcesInfo.map(({ fullLink, fullName }) => ({
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

export default loadWebPage;
