let prevName = ``;
let convertedThisSpec = false;

module.exports = {
  init: function() {
    prevName = ``;
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
    let name = input.substr(7, 16).trim();
    let keywords = input.substr(44).trim();

    convertedThisSpec = true;

    input = input.trimRight();

    if (prevName !== ``) {
      name = prevName;
      prevName = ``;
    }
    if (input.endsWith(`...`)) {
      prevName = input.substr(7, input.length - 10).trim();
      output.remove = true;
    } else {
      switch (input[24].toUpperCase()) {
        case `B`:
          output.value = (`Dcl-Proc ${name} ${keywords}`).trimRight();
          output.nextSpaces = indent;
          break;
        case `E`:
          output.beforeSpaces = -indent;
          output.value = `End-Proc`;
          break;
      }
    }

    if (output.value !== ``) {
      output.change = true;
      output.value = output.value.trimRight() + `;`;
    }
    return output;
  }
}