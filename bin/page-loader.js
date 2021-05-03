#!/usr/bin/env node
import path from 'path';
import fs from 'fs';
import program from 'commander';
import pageLoader from '../index.js';

const pkgContent = fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8');
const { version } = JSON.parse(pkgContent);

program
  .version(`${version}`)
  .description('Download web page with content.')
  .arguments('<pageUrl>')
  .option('-o, --output [dir]', 'output dir', `${process.cwd()}`)
  .action((url) => {
    pageLoader(url, program.opts().output);
  });

program.parse(process.argv);
