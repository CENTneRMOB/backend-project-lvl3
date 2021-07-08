import { promises as fsp } from 'fs';
import path from 'path';
import axios from 'axios';
import debug from 'debug';
import Listr from 'listr';
import { slugifyPath } from './slugifyUtils.js';
import extractResources from './extractResources.js';

const logPageLoader = debug('page-loader');

const isExists = (dirPath) => fsp.stat(dirPath)
  .then((stats) => stats !== false)
  .catch(() => false);

export default (inputUrl, outputPath = process.cwd()) => {
  const { origin, hostname, pathname } = new URL(inputUrl);
  logPageLoader('incoming url', inputUrl);
  const slugifiedUrl = slugifyPath(`${hostname}${pathname}`);
  const generalPath = path.resolve(outputPath, slugifiedUrl);
  const htmlFilePath = `${generalPath}.html`;
  const contentDirPath = `${generalPath}_files`;
  logPageLoader([generalPath, htmlFilePath, contentDirPath]);

  return isExists(contentDirPath)
    .then((isExistsAnswer) => {
      if (!isExistsAnswer) {
        return fsp.mkdir(contentDirPath);
      }
    })
    .then(() => axios({
      method: 'GET',
      url: inputUrl,
      responseType: 'json',
    }))
    // .then(() => downloadEngine(inputUrl))
    .then((response) => {
      logPageLoader('Response', response.status);
      const { base } = path.parse(contentDirPath);
      const [modifiedHtml, sourcesInfo] = extractResources(response.data, base, origin);
      logPageLoader(sourcesInfo);
      return fsp.writeFile(htmlFilePath, modifiedHtml)
        .then(() => sourcesInfo);
    })
    .then((sourcesInfo) => {
      const tasks = sourcesInfo.map(({ fullLink, fullName }) => ({
        title: fullLink,
        task: () => axios({
          method: 'GET',
          url: fullLink,
          responseType: 'arraybuffer',
        })
          .then((response) => fsp.writeFile(path.join(contentDirPath, fullName), response.data)),
      }));
      logPageLoader('tasks', tasks);
      const list = new Listr(tasks, { concurrent: true });
      return list.run();
    })
    .then(() => htmlFilePath);
};
