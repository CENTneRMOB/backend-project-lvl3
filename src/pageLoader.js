import fs, { promises as fsp } from 'fs';
import _ from 'lodash';
import path from 'path';
import getGeneralPath from './getGeneralPath.js';
import downloadEngine from './downloader.js';
import getPictures from './extractImages.js';

const pageLoader = (inputUrl, outputPath = process.cwd()) => {
  const generalPath = getGeneralPath(inputUrl, outputPath);
  const htmlFilePath = `${generalPath}.html`;
  const contentDirPath = `${generalPath}_files`;

  let downloadedHTMLContent;
  let modifiedData;
  let imageSources;
  let imageNames;

  return downloadEngine(inputUrl)
    .then((response) => {
      downloadedHTMLContent = response.data;
    })
    .then(() => fsp.mkdir(contentDirPath))
    .then(() => getPictures(downloadedHTMLContent, contentDirPath))
    .then((images) => {
      [modifiedData, imageSources, imageNames] = images;
    })
    .then(() => fsp.writeFile(htmlFilePath, modifiedData))
    .then(() => {
      const imageContent = _.zipObject(imageSources, imageNames);
      Object.entries(imageContent).forEach(([source, name]) => {
        downloadEngine(source, 'stream')
          .then((response) => response.data.pipe(
            fs.createWriteStream(path.join(contentDirPath, name)),
          ));
      });
    })
    .then(() => console.log(htmlFilePath));
};

export default pageLoader;
