import path from 'path';

const getNameAndFullLink = (url, localOrigin) => {
  const urlObj = new URL(url, localOrigin);
  const { protocol, href } = urlObj;
  const originalName = `${href.replace(`${protocol}//`, '')}`;
  const parsedName = path.parse(originalName);
  const { dir, name, ext } = parsedName;
  const joinedName = path.join(dir, name).replace(/\W/g, '-');
  const fullLink = href;
  const fullName = ext ? `${joinedName}${ext}` : `${joinedName}.html`;

  return { fullLink, fullName };
};

export default getNameAndFullLink;
