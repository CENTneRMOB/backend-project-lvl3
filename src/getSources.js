import cheerio from 'cheerio';
import path from 'path';
import getNameAndFullLink from './getNameAndFullLink.js';

const isLocal = (url, localOrigin) => {
  const myURL = new URL(url, localOrigin);
  return myURL.origin === localOrigin;
};

const getSources = (data, dirPath, localOrigin) => {
  const inputData = data;
  const dirName = path.parse(dirPath).base;
  const $ = cheerio.load(inputData);
  const fileInfos = [];

  $('link, img, script').each((i, el) => {
    if ($(el).attr('href')) {
      const sideLink = $(el).attr('href');
      if (isLocal(sideLink, localOrigin)) {
        const { fullLink, fullName } = getNameAndFullLink(sideLink, localOrigin);
        const relativeFilePath = path.join(dirName, fullName);
        fileInfos[i] = { fullLink, fullName };
        $(el).attr('href', `${relativeFilePath}`);
      }
    }
    if ($(el).attr('src')) {
      const sideLink = $(el).attr('src');
      if (isLocal(sideLink, localOrigin)) {
        const { fullLink, fullName } = getNameAndFullLink(sideLink, localOrigin);
        const relativeFilePath = path.join(dirName, fullName);
        fileInfos[i] = { fullLink, fullName };
        $(el).attr('src', `${relativeFilePath}`);
      }
    }
  });

  const filteredInfos = fileInfos.filter((item) => item);

  return [
    $.html(),
    filteredInfos,
  ];
};

export default getSources;
