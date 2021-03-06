#!/usr/bin/env node
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import program from 'commander';
import loadWebPage from '../index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkgContent = fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8');
const { version } = JSON.parse(pkgContent);

program
  .version(version)
  .description('Download web page with content.')
  .arguments('<pageUrl>')
  .option('-o, --output [dir]', 'output dir', process.cwd())
  .action((url) => {
    loadWebPage(url, program.opts().output)
      .then((htmlFilePath) => console.log(`Page was successfully downloaded into '${htmlFilePath}'`))
      .catch((error) => {
        console.error(error.message);

        process.exit(1);
      });
  });

program.parse(process.argv);
