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
const scope = nock(pageURL.origin);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);
const filesDirectoryName = 'ru-hexlet-io-courses_files';

const originalHtmlPath = getFixturePath('original_page.html');
const expectHtmlPath = getFixturePath('ru-hexlet-io-courses.html');
const expectCssPath = getFixturePath(path.join(filesDirectoryName, 'ru-hexlet-io-assets-application.css'));
const expectPngPath = getFixturePath(path.join(filesDirectoryName, 'ru-hexlet-io-assets-professions-nodejs.png'));
const expectSubHtmlPath = getFixturePath(path.join(filesDirectoryName, 'ru-hexlet-io-courses.html'));
const expectScriptPath = getFixturePath(path.join(filesDirectoryName, 'ru-hexlet-io-packs-js-runtime.js'));

const readFile = async (filePath, encoding = 'utf-8') => {
  const content = await fsp.readFile(filePath, encoding);
  return content;
};

beforeEach(async () => {
  tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

describe('Page-loader tests without errors expecting', () => {
  test('Is request working and get response with "OK" status', async () => {
    scope.get(pageURL.pathname)
      .reply(200, 'response');
    await pageLoader(inputURL, tmpDir);

    expect(scope.isDone()).toBe(true);
  });
  test('Files were downloaded and html was modified', async () => {
    const modifiedHtmlContent = await readFile(expectHtmlPath);
    const expectedFilesTree = await fsp.readdir(getFixturePath(filesDirectoryName));

    const mapping = [
      ['/courses', originalHtmlPath],
      ['/assets/application.css', expectCssPath],
      ['/courses', expectSubHtmlPath],
      ['/assets/professions/nodejs.png', expectPngPath],
      ['/packs/js/runtime.js', expectScriptPath],
    ];

    mapping.forEach(([pagePath, filePath]) => scope.get(pagePath)
      .replyWithFile(200, filePath));

    await pageLoader(inputURL, tmpDir);

    expect(await readFile(path.join(tmpDir, 'ru-hexlet-io-courses.html'))).toBe(modifiedHtmlContent);
    expect(await fsp.readdir(path.join(tmpDir, 'ru-hexlet-io-courses_files'))).toEqual(expectedFilesTree);

    const fixtureFiles = [
      expectCssPath,
      expectSubHtmlPath,
      expectPngPath,
      expectScriptPath,
    ];
    const savedFiles = fixtureFiles.map((filePath) => path.join(tmpDir, 'ru-hexlet-io-courses_files', path.parse(filePath).base));

    savedFiles.forEach(async (savedFilePath, index) => {
      const fixtureContent = await readFile(savedFilePath);
      const savedContent = await readFile(fixtureFiles[index]);
      expect(fixtureContent).toBe(savedContent);
    });
  });
});

describe.each([
  [404],
  [504],
  [502],
])('Tests with network and server errors expecting', (error) => {
  test(`Get ${error} code error`, async () => {
    scope.get(`/${error}`).reply();
    await expect(pageLoader(inputURL, tmpDir)).rejects.toThrow(`Request error at ${inputURL}`);
  });
});

describe('Tests with file system errors expecting', () => {
  describe.each([
    [(path.join('/var', 'lib')), 'no permissions to write in'],
    [(path.join('path', 'NotExists')), 'does not exist'],
    [originalHtmlPath, 'is not a directory'],
  ])('Writing errors', (outputPath, errorText) => {
    test(`File errors contains "${errorText}"`, async () => {
      scope.get(pageURL.pathname).reply(200, 'response');
      await expect(pageLoader(inputURL, outputPath)).rejects.toThrow(errorText);
    });
  });
  test('Output directory to webpage files already exists', async () => {
    const expected = `File system error. ${path.join(tmpDir, 'ru-hexlet-io-courses_files')} already exists`;
    scope.persist().get(pageURL.pathname).reply(200, 'response');
    await pageLoader(inputURL, tmpDir);
    await expect(pageLoader(inputURL, tmpDir)).rejects.toThrow(expected);
  });
});
