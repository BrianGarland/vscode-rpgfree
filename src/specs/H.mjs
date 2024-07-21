export function Parse(input, indent, wasSub) {
  const output = {
    remove: false,
    change: false,
    value: '',
    beforeSpaces: 0,
    nextSpaces: 0,
    isSub: false
  };

  let keywords = input.substr(7).trim();

  if (keywords.endsWith('+')) {
    output.isSub = true;
  }

  if (wasSub) {
    output.value = `${keywords}`;
  } else {
    output.value = `Ctl-Opt ${keywords}`;
  }

  if (output.value !== '') {
    output.change = true;
    if (!output.isSub) {
      output.value = `${output.value.trimRight()};`;
    } else {
      output.value = `${output.value.trimRight()}`;
    }
  }

  return output;
}
