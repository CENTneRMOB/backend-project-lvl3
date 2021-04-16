import cheerio from 'cheerio';
import path from 'path';
import getNameAndFullLink from './getNameAndFullLink.js';

const isLocal = (url, localOrigin) => {
  const myURL = new URL(url, localOrigin);
  return myURL.origin === localOrigin;
};

const getFiles = (data, dirPath, localOrigin) => {
  const inputData = data;
  const $ = cheerio.load(inputData);
  const fileInfos = [];

  $('link, img, script').each((i, el) => {
    if ($(el).attr('href')) {
      const sideLink = $(el).attr('href');
      if (isLocal(sideLink, localOrigin)) {
        const { fullLink, fullName } = getNameAndFullLink(sideLink, localOrigin);
        const filePath = path.join(dirPath, fullName);
        fileInfos[i] = { fullLink, fullName };
        $(el).attr('href', `${filePath}`);
      }
    }
    if ($(el).attr('src')) {
      const sideLink = $(el).attr('src');
      if (isLocal(sideLink, localOrigin)) {
        const { fullLink, fullName } = getNameAndFullLink(sideLink, localOrigin);
        const filePath = path.join(dirPath, fullName);
        fileInfos[i] = { fullLink, fullName };
        $(el).attr('src', `${filePath}`);
      }
    }
  });

  const filteredInfos = fileInfos.filter((item) => item);

  return [
    $.html(),
    filteredInfos,
  ];
};

export default getFiles;
