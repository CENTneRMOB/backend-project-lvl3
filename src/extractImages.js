import cheerio from 'cheerio';
import path from 'path';
import getFileName from './getFileName.js';

const getPictures = (data, dirPath) => {
  const modifiedData = data;
  const originalSources = [];

  const $ = cheerio.load(modifiedData);
  $('img').each((i, el) => {
    originalSources[i] = $(el).attr('src');
  });

  const modifiedSources = originalSources.map(getFileName);
  const imagePaths = modifiedSources.map((source) => path.join(dirPath, source));

  $('img').each((i, el) => {
    if (originalSources[i] === $(el).attr('src')) {
      $(el).attr('src', imagePaths[i]);
    }
  });

  const imageSources = originalSources.filter((source) => source.includes('.png') || source.includes('.jpg') || source.includes('.svg'));

  const imageNames = modifiedSources.filter((source) => source.includes('.png') || source.includes('.jpg') || source.includes('.svg'));

  return [
    $.html(),
    imageSources,
    imageNames,
  ];
};

export default getPictures;
