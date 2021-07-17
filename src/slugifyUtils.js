import path from 'path';

const slugifyUrl = (url) => {
  const { hostname, pathname } = url;
  const words = `${hostname}${pathname}`.match(/\w+/g);
  return words.join('-');
};

const slugifyResourceUrl = (url) => {
  const { pathname } = url;
  const { dir, name, ext } = path.parse(pathname);
  const resourcePathname = path.join(dir, name);
  const resourceUrl = new URL(resourcePathname, url.origin);
  const slugifiedUrl = slugifyUrl(resourceUrl);

  return `${slugifiedUrl}${ext || '.html'}`;
};

export {
  slugifyUrl,
  slugifyResourceUrl,
};
