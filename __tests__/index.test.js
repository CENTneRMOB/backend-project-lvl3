import path from 'path';
import nock from 'nock';
import os from 'os';
import { fileURLToPath } from 'url';
import { promises as fsp } from 'fs';
import pageLoader from '../src/pageLoader.js';

const inputURL = 'https://ru.hexlet.io/courses';
const pageURL = new URL(inputURL);
let tmpDir;
nock.disableNetConnect();
const scope = nock(pageURL.origin).persist();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filesDirectoryName = 'ru-hexlet-io-courses_files';
const getFixturePath = (filename = '') => path.join(__dirname, '..', '__fixtures__', filename);

const expectHtmlAbsolutePath = getFixturePath('ru-hexlet-io-courses.html');

const resourcesPaths = [
  ['/assets/application.css', path.join(filesDirectoryName, 'ru-hexlet-io-assets-application.css')],
  ['/courses', path.join(filesDirectoryName, 'ru-hexlet-io-courses.html')],
  ['/assets/professions/nodejs.png', path.join(filesDirectoryName, 'ru-hexlet-io-assets-professions-nodejs.png')],
  ['/packs/js/runtime.js', path.join(filesDirectoryName, 'ru-hexlet-io-packs-js-runtime.js')],
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
    await pageLoader(inputURL, tmpDir);

    expect(scope.isDone()).toBe(true);
  });

  test('Main html file was downloaded and modified', async () => {
    const modifiedHtmlContent = await readFile(expectHtmlAbsolutePath);

    await pageLoader(inputURL, tmpDir);

    expect(await readFile(path.join(tmpDir, 'ru-hexlet-io-courses.html'))).toBe(modifiedHtmlContent);
  });

  test.each(resourcesPaths)('File from %s was downloaded and saved to %s', async (sourceUrl, sourcePath) => {
    await pageLoader(inputURL, tmpDir);

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
    await expect(pageLoader(`${pageURL.origin}/${error}`, tmpDir)).rejects.toThrow(`Request error at ${pageURL.origin}`);
  });
});

describe('Tests with file system errors expecting', () => {
  describe.each([
    [(path.join('/var', 'lib')), 'no permissions to write in'],
    [(path.join('path', 'NotExists')), 'does not exist'],
    [expectHtmlAbsolutePath, 'is not a directory'],
  ])('Writing errors', (outputPath, errorText) => {
    test(`File errors contains "${errorText}"`, async () => {
      await expect(pageLoader(inputURL, outputPath)).rejects.toThrow(errorText);
    });
  });
  test('Output directory to webpage files already exists', async () => {
    const existingPath = path.join(tmpDir, filesDirectoryName);
    const expected = `File system error. ${existingPath} already exists`;
    await pageLoader(inputURL, tmpDir);
    await expect(pageLoader(inputURL, tmpDir)).rejects.toThrow(expected);
  });
});
