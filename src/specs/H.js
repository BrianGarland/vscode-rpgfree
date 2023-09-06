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
    let keywords = input.substr(7);

    convertedThisSpec = true;

    output.value = `Ctl-Opt ` + keywords.trim();
  
    if (output.value !== ``) {
      output.change = true;
      output.value = output.value.trimRight() + `;`;
    }
    return output;
  }
}