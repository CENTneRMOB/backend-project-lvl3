import cheerio from 'cheerio';
import path from 'path';
import { slugifyResourceUrl } from './slugifyUtils.js';

const tagsAttributes = {
  link: 'href',
  img: 'src',
  script: 'src',
};

export default (data, dirName, localOrigin) => {
  const $ = cheerio.load(data);
  const resources = [];

  Object.entries(tagsAttributes).forEach(([tag, attribute]) => {
    $(tag).each((i, element) => {
      const tagElement = $(element);
      const attributeUrl = tagElement.attr(attribute);
      const attributeUrlObj = new URL(attributeUrl, localOrigin);

      if (attributeUrlObj.origin !== localOrigin) {
        return;
      }

      const resourceUrl = attributeUrlObj.toString();
      const resourceFileName = slugifyResourceUrl(attributeUrlObj);
      const relativeFilePath = path.join(dirName, resourceFileName);
      resources.push({ resourceUrl, resourceFileName });
      tagElement.attr(attribute, `${relativeFilePath}`);
    });
  });

  return [
    $.html(),
    resources,
  ];
};
