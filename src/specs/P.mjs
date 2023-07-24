let prevName = '';

export function Parse(input, indent, wasSub) {
  let output = {
    remove: false,
    change: false,
    value: '',

    beforeSpaces: 0,
    nextSpaces: 0
  };

  let name = input.substring(7, 23).trim();
  let keywords = input.substring(44).trim();

  input = input.trimRight();

  if (prevName != '') {
    name = prevName;
    prevName = '';
  }
  if (input.endsWith('...')) {
    prevName = input.slice(7, -3).trim();
    output.remove = true;
  } else {
    switch (input[24].toUpperCase()) {
      case 'B':
        output.value = (`Dcl-Proc ${name} ${keywords}`).trimRight();
        output.nextSpaces = 2;
        break;
      case 'E':
        output.beforeSpaces = -indent;
        output.value = 'End-Proc';
        break;
    }
  }

  if (output.value !== '') {
    output.change = true;
    output.value = `${output.value.trimRight()};`;
  }
  return output;
}
