import cheerio from 'cheerio';
import path from 'path';
import { getFullSlugifiedName } from './slugifyUtils.js';

export default (data, dirName, localOrigin) => {
  const $ = cheerio.load(data);
  const fileInfos = [];

  $('link, img, script').each((i, el) => {
    const elAttrbs = {
      link: 'href',
      img: 'src',
      script: 'src',
    };

    const sideLink = $(el).attr(elAttrbs[el.name]);
    const urlObj = new URL(sideLink, localOrigin);
    if (urlObj.origin === localOrigin) {
      const { href } = urlObj;
      const fullName = getFullSlugifiedName(urlObj);
      const relativeFilePath = path.join(dirName, fullName);
      fileInfos.push({ fullLink: href, fullName });
      $(el).attr(elAttrbs[el.name], `${relativeFilePath}`);
    }
  });

  return [
    $.html(),
    fileInfos,
  ];
};
