import path from 'path';

const getFileName = (url) => {
  const myURL = new URL(url);
  const { protocol } = myURL;
  const originalName = `${url.replace(`${protocol}//`, '')}`;
  const parsedName = path.parse(originalName);
  const { dir, name, ext } = parsedName;
  const joinedName = path.join(dir, name);

  return `${joinedName.replace(/\W/g, '-')}${ext}`;
};

export default getFileName;
