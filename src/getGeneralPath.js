import path from 'path';

const getFullPath = (dirPath, filePath) => path.resolve(dirPath, filePath);

const getGeneralPath = (url, enteredPath) => {
  const myURL = new URL(url);
  const { protocol } = myURL;
  const mainPath = `${url.replace(`${protocol}//`, '').replace(/\W/g, '-')}`;
  const fullPath = getFullPath(enteredPath, mainPath);
  return fullPath;
};

export default getGeneralPath;
