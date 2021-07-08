import path from 'path';
import nock from 'nock';
import os from 'os';
import { fileURLToPath } from 'url';
import { promises as fsp } from 'fs';
import loadWebPage from '../index.js';

const inputURL = 'https://ru.hexlet.io/courses';
const pageURL = new URL(inputURL);
let tmpDir;
nock.disableNetConnect();
const scope = nock(pageURL.origin).persist();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resourcesDirName = 'ru-hexlet-io-courses_files';
const getFixturePath = (filename = '') => path.join(__dirname, '..', '__fixtures__', filename);

const expectedHtmlAbsolutePath = getFixturePath('ru-hexlet-io-courses.html');

const resourcesPaths = [
  ['/assets/application.css', path.join(resourcesDirName, 'ru-hexlet-io-assets-application.css')],
  ['/courses', path.join(resourcesDirName, 'ru-hexlet-io-courses.html')],
  ['/assets/professions/nodejs.png', path.join(resourcesDirName, 'ru-hexlet-io-assets-professions-nodejs.png')],
  ['/packs/js/runtime.js', path.join(resourcesDirName, 'ru-hexlet-io-packs-js-runtime.js')],
];

const readFile = (filePath, encoding = 'utf-8') => fsp.readFile(filePath, encoding);

beforeAll(() => {
  resourcesPaths.forEach(([pathName, fileName]) => scope
    .get(pathName).replyWithFile(200, path.join(getFixturePath(), fileName)));
});

beforeEach(async () => {
  tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

describe('Page-loader tests without errors expecting', () => {
  test('Is request working and get response with "OK" status', async () => {
    await loadWebPage(inputURL, tmpDir);

    expect(scope.isDone()).toBe(true);
  });

  test('Main html file was downloaded and modified', async () => {
    const modifiedHtmlContent = await readFile(expectedHtmlAbsolutePath);
    const savedFilePath = path.join(tmpDir, 'ru-hexlet-io-courses.html');

    await loadWebPage(inputURL, tmpDir);

    expect(await readFile(savedFilePath)).toBe(modifiedHtmlContent);
  });

  test.each(resourcesPaths)('File from %s was downloaded and saved to %s', async (sourceUrl, sourcePath) => {
    await loadWebPage(inputURL, tmpDir);

    const savedFilePath = path.join(tmpDir, sourcePath);
    const fixtureFilePath = path.join(getFixturePath(), sourcePath);
    const fixtureContent = await readFile(fixtureFilePath);
    const savedContent = await readFile(savedFilePath);

    expect(savedContent).toBe(fixtureContent);
  });
});

describe.each([
  404,
  504,
  502,
])('Tests with network and server errors expecting', (error) => {
  test(`Get ${error} code error`, async () => {
    const errorUrl = `${pageURL.origin}/${error}`;
    await expect(loadWebPage(errorUrl, tmpDir))
      .rejects
      .toThrow(`${pageURL.origin}`);
  });
});

describe.each([
  [(path.join('/var', 'lib')), 'permission denied'],
  [(path.join('path', 'NotExists')), 'no such file or directory'],
  [expectedHtmlAbsolutePath, 'not a directory'],
])('Writing errors', (outputPath, errorText) => {
  test(`File errors contains "${errorText}"`, async () => {
    await expect(loadWebPage(inputURL, outputPath))
      .rejects
      .toThrow(errorText);
  });
});
