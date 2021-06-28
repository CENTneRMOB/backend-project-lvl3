const slugifyUrl = (url) => {
  const { hostname, pathname } = url;
  return `${hostname}${pathname}`.replace(/\W/g, '-');
};

export default slugifyUrl;
