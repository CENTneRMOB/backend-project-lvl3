import path from 'path';
import nock from 'nock';
import os from 'os';
import { fileURLToPath } from 'url';
import { promises as fsp } from 'fs';
import pageLoader from '../src/pageLoader.js';
import getGeneralPath from '../src/getGeneralPath.js';
import getPictures from '../src/extractImages.js';
import downloadEngine from '../src/downloader.js';

const inputURL = 'https://ru.hexlet.io/teams';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const getFixturePath = (file) => path.join(dirname, '..', '__fixtures__', file);

let tmpDir;

beforeAll(async () => {
  tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  nock.disableNetConnect();
});

test('got response?', async () => {
  const myURL = new URL(inputURL);
  const scope = nock(myURL.origin)
    .get(myURL.pathname)
    .reply(200, 'response');

  await pageLoader(inputURL, tmpDir);

  expect(scope.isDone()).toBe(true);
});

test('downloaded .html page changing and downloading images', async () => {
  const dest = `${getGeneralPath(inputURL, tmpDir)}.html`;
  const sourcePath = getFixturePath('original_page.html');
  const sourceContent = await fsp.readFile(sourcePath, 'utf-8');
  await fsp.copyFile(sourcePath, dest);
  const [modifiedHtml, sources] = getPictures(sourceContent, tmpDir);

  const myURL = new URL(sources[0]);
  const scope = nock(myURL.origin)
    .get(myURL.pathname)
    .reply(200, 'response');

  await downloadEngine(sources[0]);

  expect(modifiedHtml.includes(tmpDir)).toBe(true);
  expect(scope.isDone()).toBe(true);
});
