import path from 'path';
import nock from 'nock';
import os from 'os';
import { fileURLToPath } from 'url';
import { promises as fsp } from 'fs';
import debug from 'debug';
import pageLoader from '../src/pageLoader.js';
import getGeneralPath from '../src/getGeneralPath.js';
import getFiles from '../src/extractFiles.js';
import downloadEngine from '../src/downloader.js';

const logTest = debug('page-loader:tests');
const inputURL = 'https://ru.hexlet.io/teams';
const localOrigin = new URL(inputURL).origin;
logTest('testing URL', inputURL);

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const getFixturePath = (file) => path.join(dirname, '..', '__fixtures__', file);

let tmpDir;

beforeAll(async () => {
  tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  logTest('tmpDir', tmpDir);
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

test('downloaded .html page changing and downloading files', async () => {
  const dest = `${getGeneralPath(inputURL, tmpDir)}.html`;
  logTest('main html file', dest);
  const sourcePath = getFixturePath('original_page.html');
  const sourceContent = await fsp.readFile(sourcePath, 'utf-8');
  await fsp.copyFile(sourcePath, dest);
  const [modifiedHtml, sources] = getFiles(sourceContent, tmpDir, localOrigin);
  logTest('got sources?', sources.length !== 0);
  await fsp.writeFile(dest, modifiedHtml);
  const readedModifiedContent = await fsp.readFile(dest, 'utf-8');

  const myURL = new URL(sources[0].fullLink);
  const scope = nock(myURL.origin)
    .get(myURL.pathname)
    .reply(200, 'response');

  await downloadEngine(sources[0].fullLink);

  expect(readedModifiedContent.includes(tmpDir)).toBe(true);
  expect(readedModifiedContent).toEqual(modifiedHtml);
  expect(scope.isDone()).toBe(true);
});
