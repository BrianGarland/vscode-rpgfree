import { join, resolve, relative, basename } from 'path';
import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';

const __in = 'in';
const __out = 'out';
const __xfail = 'xfail';

function flatten(lists) {
  return lists.reduce((a, b) => a.concat(b), []);
}

function listDirs(srcpath) {
  return readdirSync(srcpath)
    .map(file => join(srcpath, file))
    .filter(path => statSync(path).isDirectory());
}

function listDirsRecurse(srcpath) {
  return [srcpath, ...flatten(listDirs(srcpath).map(listDirsRecurse))];
}

export function read(dir, f = __in) {
  return readFileSync(join(dir, `${f}.rpgle`), 'utf8');
}

export function write(dir, data, f = __out) {
  writeFileSync(join(dir, `${f}.rpgle`), data, 'utf8');
}

export const indent = 2;
export const testRoot = resolve('test');
export const testName = dir => [relative(testRoot, dir), dir];
const allTestDirs = listDirsRecurse(testRoot)
  .reduce((acc, dir) => {
    const files = readdirSync(dir)
      .map(f => join(dir, f))
      .filter(f => statSync(f).isFile())
      .map(f => basename(f));
    if (files.includes(`${__in}.rpgle`) && files.includes(`${__out}.rpgle`)) {
      if (files.some(f => f.startsWith(__xfail))) {
        acc.skip.push(dir);
      } else {
        acc.run.push(dir);
      }
    }
    return acc;
  }, { run: [], skip: [] });
export const runDirs = allTestDirs.run;
export const skipDirs = allTestDirs.skip;
