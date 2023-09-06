let convertedThisSpec = false;

module.exports = {
  init: function() {
    convertedThisSpec = false;
  },

  initOutput: function() {
    return {
      arrayoutput: [],
      beforeSpaces: 0,
      change: false,
      nextSpaces: 0,
      remove: false,
      value: ``
    };
  },

  final: function(indent, wasSub, wasLIKEDS) {
    let output = this.initOutput();
    if (!convertedThisSpec) {
      return output;
    }

    return output;
  },

  parse: function (input, indent, wasSub, wasLIKEDS) {
    let output = this.initOutput();

    let name = input.substr(7, 10).trim(); //File name
    let type = input.substr(17, 1).toUpperCase(); // I, U, O, C
    let fileadd = input.substr(20, 1).toUpperCase(); // A
    let external = input.substr(22, 1).toUpperCase(); // F, E
    let recordLength = input.substr(23, 5).toUpperCase();
    let field = input.substr(34, 1).toUpperCase(); //KEYED
    let device = input.substr(36, 7).toUpperCase().trim(); //device: DISK, WORKSTN
    let keywords = input.substr(44).trim();

    convertedThisSpec = true;

    output.value = `Dcl-F ${name}`;

    switch (type) {
      case `I`:
        if (fileadd === `A`) {
          type = `*INPUT: *OUTPUT`;
        } else {
          type = `*INPUT`;
        }
        break;
      case `U`:
        type = `*UPDATE: *DELETE: *OUTPUT`;
        break;
      case `O`:
        if (device !== `PRINTER`) {
          type = `*OUTPUT`;
        } else {
          type = ``;
        }
        break;
      case `C`:
        if (device !== `WORKSTN`) {
          type = `*INPUT: *OUTPUT`;
        } else {
          type = ``;
        }
        break;

      default:
        type = ``;
        break;
    }

    if (external !== `E`) {
      device = `${device}(${recordLength.trim()})`;
    }

    if (device !== `DISK`) {
      output.value += ` ` + device;
    }

    if (type !== ``) {
      output.value += ` Usage(` + type + `)`;
    }

    if (field === `K`) {
      output.value += ` Keyed`;
    }

    if (keywords !== ``) {
      if (name === ``) {
        output.aboveKeywords = keywords;
      } else {
        output.value += ` ` + keywords;
      }
    }

    if (output.value !== ``) {
      output.change = true;
      output.value = output.value.trimRight() + `;`;
    }
    return output;
  }
}
