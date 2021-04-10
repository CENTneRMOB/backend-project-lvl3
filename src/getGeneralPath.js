import path from 'path';

const getFullPath = (dirPath, filePath) => path.resolve(dirPath, filePath);

const getGeneralPath = (url, enteredPath) => {
  const myURL = new URL(url);
  const { protocol } = myURL;
  const mainPath = url.replace(`${protocol}//`, '').split(/\W/g)
    .filter((item) => item).join('-');
  const fullPath = getFullPath(enteredPath, mainPath);
  return fullPath;
};

export default getGeneralPath;
