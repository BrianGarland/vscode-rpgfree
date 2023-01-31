module.exports = {
  Parse: function (input, indent, wasSub) {
    let output = {
      remove: false,
      change: false,
      value: ``,

      beforeSpaces: 0,
      nextSpaces: 0
    };

    let name = input.substr(7, 10).trim(); //File name
    let type = input.substr(17, 1).toUpperCase(); // I, U, O, C
    let fileadd = input.substr(20, 1).toUpperCase(); // A
    let external = input.substr(22, 1).toUpperCase(); // F, E
    let recordLength = input.substr(23, 5).toUpperCase();
    let field = input.substr(34, 1).toUpperCase(); //KEYED
    let device = input.substr(36, 7).toUpperCase().trim(); //device: DISK, WORKSTN
    let keywords = input.substr(44).trim();

    output.value = `Dcl-F ` + name;

    switch (type) {
    case `I`:
      if (fileadd == 'A')
        type = `*Input:*Output`;
      else
        type = `*Input`;
      break;
    case `U`:
      type = `*Update:*Delete:*Output`;
      break;
    case `O`:
      if (device != `PRINTER`)
        type = `*Output`;
      else
        type = ``;
      break;
    case `C`:
      if (device != `WORKSTN`)
        type = `*INPUT:*OUTPUT`;
      else
        type = ``;
      break;

    default:
      type = ``;
      break;
    }

    if (external != `E`) {
      device = device + `(` + recordLength.trim() + `)`;
    }

    if (device != `DISK`)
      output.value += ` ` + device;

    if (type != ``)
      output.value += ` Usage(` + type + `)`;

    if (field == `K`)
      output.value += ` Keyed`;

    if (keywords != ``) {
      if (name == ``)
        output.aboveKeywords = keywords;
      else
        output.value += ` ` + keywords;
    }

    if (output.value !== ``) {
      output.change = true;
      output.value = output.value.trimRight() + `;`;
    }
    return output;
  }
}
