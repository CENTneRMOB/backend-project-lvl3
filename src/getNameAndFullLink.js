import path from 'path';

const getNameAndFullLink = (url, localOrigin) => {
  const urlObj = new URL(url, localOrigin);
  const { hostname, pathname, href } = urlObj;
  const filePath = `${hostname}${pathname}`;
  const parsedFilePath = path.parse(filePath);
  const { dir, name, ext } = parsedFilePath;
  const slugifiedFileName = path.join(dir, name).replace(/\W/g, '-');
  const fullName = ext ? `${slugifiedFileName}${ext}` : `${slugifiedFileName}.html`;

  return { fullLink: href, fullName };
};

export default getNameAndFullLink;
