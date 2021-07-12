import path from 'path';

const slugifyUrl = (urlObj) => {
  const { hostname, pathname } = urlObj;
  if (pathname === '/') {
    return hostname.replace(/\W/g, '-');
  }

  const { dir, name } = path.parse(pathname);
  const fileName = path.join(dir, name);
  return `${hostname}${fileName}`.replace(/\W/g, '-');
};

const getSlugifiedResourceName = (urlObj) => {
  const slugifiedUrl = slugifyUrl(urlObj);
  const { hostname, pathname } = urlObj;
  const { ext } = path.parse(`${hostname}${pathname}`);
  return `${slugifiedUrl}${ext || '.html'}`;
};

export {
  slugifyUrl,
  getSlugifiedResourceName,
};
