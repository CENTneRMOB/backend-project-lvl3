import path from 'path';

const slugifyPath = (pathString) => pathString.replace(/\W/g, '-');

const getFullSlugifiedName = (urlObj) => {
  const { hostname, pathname } = urlObj;
  const { dir, name, ext } = path.parse(`${hostname}${pathname}`);
  const slugifiedFileName = slugifyPath(path.join(dir, name));
  const fullName = `${slugifiedFileName}${ext || '.html'}`;

  return fullName;
};

export {
  slugifyPath,
  getFullSlugifiedName,
};
