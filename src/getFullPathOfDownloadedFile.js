import path from 'path';

const getFullPath = (dirPath, filePath) => path.resolve(dirPath, filePath);

const getFullPathOfDownloadedFile = (inputUrl, outputPath) => {
  const myURL = new URL(inputUrl);
  const { protocol } = myURL;
  const downloadedFilename = `${inputUrl.replace(`${protocol}//`, '').replace(/\W/g, '-')}.html`;
  const outputFullPath = getFullPath(outputPath, downloadedFilename);
  return outputFullPath;
};

export default getFullPathOfDownloadedFile;
