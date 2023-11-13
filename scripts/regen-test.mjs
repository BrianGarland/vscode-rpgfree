import { indent, read, runDirs, write } from '../lib/testsuite.mjs';
import { RpgleFree } from '../src/RpgleFree.mjs';

function regen(dir) {
  const input = read(dir);
  const lines = input.split('\n');
  new RpgleFree(lines, indent).parse();
  const output = lines.join('\n');
  write(dir, output);
}

// TODO: parallelize when necessary
runDirs.forEach(t => regen(t));
