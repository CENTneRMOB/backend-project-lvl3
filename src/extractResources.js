import cheerio from 'cheerio';
import path from 'path';
import { getSlugifiedResourceName } from './slugifyUtils.js';

export default (data, dirName, localOrigin) => {
  const $ = cheerio.load(data);
  const resources = [];

  const tagsAttrbs = {
    link: 'href',
    img: 'src',
    script: 'src',
  };

  Object.keys(tagsAttrbs).forEach((tag) => {
    $(tag).each((i, element) => {
      const attrbUrl = $(element).attr(tagsAttrbs[element.name]);
      const attrbUrlObj = new URL(attrbUrl, localOrigin);
      if (attrbUrlObj.origin !== localOrigin) {
        return;
      }
      const { href } = attrbUrlObj;
      const resourceFileName = getSlugifiedResourceName(attrbUrlObj);
      const relativeFilePath = path.join(dirName, resourceFileName);
      resources.push({ resourceUrl: href, resourceFileName });
      $(element).attr(tagsAttrbs[element.name], `${relativeFilePath}`);
    });
  });

  return [
    $.html(),
    resources,
  ];
};
