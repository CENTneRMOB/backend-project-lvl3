import path from 'path';
import nock from 'nock';
import os from 'os';
import { promises as fsp } from 'fs';
import pageLoader from '../src/pageLoader.js';

const inputURL = 'https://ru.hexlet.io/courses';

let tmpDir;

beforeEach(async () => {
  tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('got response?', async () => {
  nock.disableNetConnect();
  const myURL = new URL(inputURL);
  const scope = nock(myURL.origin)
    .get(myURL.pathname)
    .reply(200, 'response');

  await pageLoader(inputURL, tmpDir);

  expect(scope.isDone()).toBe(true);
});
