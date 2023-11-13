export function Parse(input, indent, wasSub) {
  const output = {
    remove: false,
    change: false,
    value: '',

    beforeSpaces: 0,
    nextSpaces: 0
  };

  const name = input.substring(7, 17).trim(); //File name
  let type = input.substring(17, 18).toUpperCase(); // I, U, O, C
  const fileadd = input.substring(20, 21).toUpperCase(); // A
  const external = input.substring(22, 23).toUpperCase(); // F, E
  const recordLength = input.substring(23, 28).toUpperCase();
  const field = input.substring(34, 35).toUpperCase(); //KEYED
  let device = input.substring(36, 43).toUpperCase().trim(); //device: DISK, WORKSTN
  const keywords = input.substring(44).trim();

  output.value = `Dcl-F ${name}`;

  switch (type) {
    case 'I':
      if (fileadd === 'A')
        type = '*Input:*Output';

      else
        type = '*Input';
      break;

    case 'U':
      type = '*Update:*Delete:*Output';
      break;

    case 'O':
      if (device !== 'PRINTER')
        type = '*Output';

      else
        type = '';
      break;

    case 'C':
      if (device !== 'WORKSTN')
        type = '*INPUT:*OUTPUT';

      else
        type = '';
      break;

    default:
      type = '';
      break;
  }

  if (external !== 'E') {
    device = `${device}(${recordLength.trim()})`;
  }
  if (device !== 'DISK') {
    output.value += ` ${device}`;
  }
  if (type !== '') {
    output.value += ` Usage(${type})`;
  }
  if (field === 'K') {
    output.value += ' Keyed';
  }
  if (keywords !== '') {
    if (name === '') {
      output.aboveKeywords = keywords;
    } else {
      output.value += ` ${keywords}`;
    }
  }
  if (output.value !== '') {
    output.change = true;
    output.value = `${output.value.trimRight()};`;
  }
  return output;
}
