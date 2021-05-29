import path from 'path';
import nock from 'nock';
import os from 'os';
import { fileURLToPath } from 'url';
import { promises as fsp } from 'fs';
import pageLoader from '../src/pageLoader.js';

const inputURL = 'https://page-loader.hexlet.repl.co';
let tmpDir;
nock.disableNetConnect();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);
const getExpectFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', 'page-loader-hexlet-repl-co_files', filename);

const originalHtmlPath = getFixturePath('original_page.html');
const expectHtmlPath = getFixturePath('page-loader-hexlet-repl-co.html');
const expectCssPath = getExpectFixturePath('page-loader-hexlet-repl-co-assets-application.css');
const expectPngPath = getExpectFixturePath('page-loader-hexlet-repl-co-assets-professions-nodejs.png');
const expectSubHtmlPath = getExpectFixturePath('page-loader-hexlet-repl-co-courses.html');
const expectScriptPath = getExpectFixturePath('page-loader-hexlet-repl-co-script.js');

beforeEach(async () => {
  tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

describe('Page-loader tests without errors expecting', () => {
  test('Is request working and get response with "OK" status', async () => {
    const myURL = new URL(inputURL);
    const scope = nock(myURL.origin)
      .get(myURL.pathname)
      .reply(200, 'response');
    await pageLoader(inputURL, tmpDir);

    expect(scope.isDone()).toBe(true);
  });

  test('Files were downloaded and html was modified', async () => {
    const modifiedHtmlContent = await fsp.readFile(expectHtmlPath, 'utf-8');
    const expectedFilesTree = await fsp.readdir(getExpectFixturePath(''));
    const myURL = new URL(inputURL);

    nock(myURL.origin).get('/').reply(200, await fsp.readFile(originalHtmlPath, 'utf-8'));
    nock(myURL.origin).get('/assets/application.css').reply(200, await fsp.readFile(expectCssPath, 'utf-8'));
    nock(myURL.origin).get('/courses').reply(200, await fsp.readFile(expectSubHtmlPath, 'utf-8'));
    nock(myURL.origin).get('/assets/professions/nodejs.png').replyWithFile(200, expectPngPath);
    nock(myURL.origin).get('/script.js').replyWithFile(200, expectScriptPath);

    await pageLoader(inputURL, tmpDir);

    expect(modifiedHtmlContent).toBe(await fsp.readFile(path.join(tmpDir, 'page-loader-hexlet-repl-co.html'), 'utf-8'));
    expect(expectedFilesTree).toEqual(await fsp.readdir(path.join(tmpDir, 'page-loader-hexlet-repl-co_files')));
  });
});

describe.each([
  ['Response with 300 status', `Request error at ${inputURL}. Response with 300 status`],
  ['Response with 400 status', `Request error at ${inputURL}. Response with 400 status`],
  ['Response with 500 status', `Request error at ${inputURL}. Response with 500 status`],
])('Tests with network and server errors expecting', (errorCode, expected) => {
  test(`Get ${errorCode}`, async () => {
    const myURL = new URL(inputURL);
    nock(myURL.origin)
      .get(myURL.pathname)
      .replyWithError(errorCode);
    await expect(pageLoader(inputURL, tmpDir)).rejects.toThrow(expected);
  });
});

describe('Tests with file system errors expecting', () => {
  const myURL = new URL(inputURL);

  test('Permission denied error', async () => {
    const expected = `File system error. You have no permissions to write in ${tmpDir}`;
    await fsp.chmod(tmpDir, 0o444);
    nock(myURL.origin).get(myURL.pathname).reply(200, 'response');

    await expect(pageLoader(inputURL, tmpDir)).rejects.toThrow(expected);
  });

  test('Output directory does not exist', async () => {
    const newOutputDir = path.join(tmpDir, 'NotExists');
    const expected = `File system error. ${newOutputDir} does not exist`;
    nock(myURL.origin).get(myURL.pathname).reply(200, 'response');

    await expect(pageLoader(inputURL, newOutputDir)).rejects.toThrow(expected);
  });

  test('Get file path instead directory path as output', async () => {
    const newOutputPath = path.join(tmpDir, 'justFile.txt');
    await fsp.writeFile(newOutputPath, 'Hello, Im txt file');
    const expected = `File system error. ${newOutputPath} is not a directory`;
    nock(myURL.origin).get(myURL.pathname).reply(200, 'response');

    await expect(pageLoader(inputURL, newOutputPath)).rejects.toThrow(expected);
  });

  test('Output directory to webpage files already exists', async () => {
    const expected = `File system error. ${path.join(tmpDir, 'page-loader-hexlet-repl-co_files')} already exists`;
    nock(myURL.origin).get(myURL.pathname).reply(200, 'response');

    await pageLoader(inputURL, tmpDir);
    nock(myURL.origin).get(myURL.pathname).reply(200, 'response');
    await expect(pageLoader(inputURL, tmpDir)).rejects.toThrow(expected);
  });
});
