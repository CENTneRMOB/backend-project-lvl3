import { promises as fsp } from 'fs';
import path from 'path';
import axios from 'axios';
import debug from 'debug';
import Listr from 'listr';
import { slugifyUrl } from './slugifyUtils.js';
import extractResources from './extractResources.js';

const logPageLoader = debug('page-loader');
const axiosInstance = axios.create();

const downloadResource = (fileUrl, filePath) => axiosInstance.get(fileUrl, { responseType: 'arraybuffer' })
  .then((response) => fsp.writeFile(filePath, response.data));

export default (inputUrl, outputPath = process.cwd()) => {
  const inputUrlObj = new URL(inputUrl);
  logPageLoader('incoming url', inputUrl);
  const slugifiedUrl = slugifyUrl(inputUrlObj);
  const mainHtmlFileName = `${slugifiedUrl}.html`;
  const contentDirName = `${slugifiedUrl}_files`;
  const htmlFilePath = path.resolve(outputPath, mainHtmlFileName);
  const contentDirPath = path.resolve(outputPath, contentDirName);
  logPageLoader([slugifiedUrl, htmlFilePath, contentDirPath]);

  return axiosInstance.get(inputUrl)
    .then((response) => fsp.access(contentDirPath)
      .catch(() => fsp.mkdir(contentDirPath))
      .then(() => response))
    .then((response) => {
      logPageLoader('Response', response.status);
      const [
        modifiedHtml,
        resources,
      ] = extractResources(response.data, contentDirName, inputUrlObj.origin);

      logPageLoader(resources);
      return fsp.writeFile(htmlFilePath, modifiedHtml)
        .then(() => resources);
    })
    .then((resources) => {
      const tasks = resources.map(({ resourceUrl, resourceFileName }) => ({
        title: resourceUrl,
        task: () => {
          const filePath = path.join(contentDirPath, resourceFileName);
          return downloadResource(resourceUrl, filePath);
        },
      }));
      logPageLoader('tasks', tasks);
      const list = new Listr(tasks, { concurrent: true });
      return list.run();
    })
    .then(() => htmlFilePath);
};
