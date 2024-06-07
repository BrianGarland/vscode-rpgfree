import { indent, read, runDirs, skipDirs, testName } from '../lib/testsuite.mjs';
import { RpgleFree } from '../src/RpgleFree.mjs';

const testRun = async (_name, dir) => {
  const input = read(dir, 'in');
  const expected = read(dir, 'out');

  // TODO: We should not be doing this, these are implementation details an need
  // to be hidden from the API consumer.

  // NOTE: In the extension, we split on `eol` which can be \n or \r\n,
  // depending on the editor's config. We're not going to do that here.
  // Everything is in \n.
  const lines = input.split('\n');
  new RpgleFree(lines, indent).parse();
  const found = lines.join('\n');

  expect(found.trim()).not.toBe('');
  expect(found).toBe(expected);
};

const runs = runDirs.map(testName);
const skips = skipDirs.map(testName);

test.concurrent.each(runs)('%s', testRun);
test.concurrent.skip.each(skips)('🐞 %s', testRun);
