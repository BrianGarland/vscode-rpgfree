import { skipDirs, testName } from '../lib/testsuite.mjs';

console.error('List of known bugs:\n');
skipDirs.forEach(dir => {
  console.error(`  🐞 ${testName(dir)[0]}`)
});
