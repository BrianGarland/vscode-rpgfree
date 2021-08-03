let isSubf = false;
let prevName = ``;
let blockType = ``;
let DSisQualified = false;
let DSisLIKEDS = false;

module.exports = {
  Parse: function (input, indent, wasSub) {
    let output = {
      remove: false,
      change: false,
      value: ``,

      beforeSpaces: 0,
      nextSpaces: 0,

      var: {
        standalone: false,
        name: ``,
        type: ``,
        len: 0
      }
    };

    let potentialName = input.substr(7).trim();
    let name = input.substr(7, 14).trim();
    let pos = input.substr(30, 3).trim();
    let len = input.substr(33, 7).trim();
    let type = input.substr(40, 1).trim();
    let decimals = input.substr(41, 3).trim();
    let field = input.substr(24, 2).trim().toUpperCase();
    let keywords = input.substr(44).trim();

    output.var.standalone = (field === `S`);
    output.var.name = name;
    output.var.type = type;
    output.var.len = Number(len);

    if (keywords.endsWith(`+`)) {
      keywords = keywords.substr(0, keywords.length-1);
    }

    if (type == ``) {
      if (decimals == ``)
        output.var.type = `A`; //Character
      else
        output.var.type = `S`; //Zoned
    }

    if (pos != ``) {
      len = String(Number(len) - Number(pos) + 1);
      keywords = `Pos(` + pos + `) ` + keywords;
    }


    if (prevName != ``) {
      name = prevName;
      prevName = ``;
    }
    if (potentialName.endsWith(`...`)) {
      prevName = potentialName.substr(0, potentialName.length - 3);
      output.remove = true;
      if (wasSub) {
      	output.isSub = true;
      }
    }

	
    if (output.remove === false) {
      switch (type.toUpperCase()) {
      case `A`:
        if (keywords.toUpperCase().indexOf(`VARYING`) >= 0) {
          keywords = keywords.replace(/varying/ig, ``);
          type = `Varchar`;
        } else {
          type = `Char`;
        }
        type += `(` + len + `)`;
        break;
      case `B`:
        type = `Bindec` + `(` + len + `)`;
        break;
      case `C`:
        type = `Ucs2` + `(` + len + `)`;
        break;  
      case `D`:
        type = `Date`;
        break;
      case `F`:
        type = `Float` + `(` + len + `)`;
        break;
      case `G`:
        if (keywords.toUpperCase().indexOf(`VARYING`) >= 0) {
          keywords = keywords.replace(/varying/ig, ``);
          type = `Vargraph`;
        } else {
          type = `Graph`;
        }
        type += `(` + len + `)`;
        break;
      case `I`:
        type = `Int` + `(` + len + `)`;
        break;
      case `N`:
        type = `Ind`;
        break;
      case `P`:
        type = `Packed` + `(` + len + `:` + decimals + `)`;
        break;
      case `S`:
        type = `Zoned` + `(` + len + `:` + decimals + `)`;
        break;
      case `T`:
        type = `Time`;
        break;
      case `U`:
        type = `Uns` + `(` + len + `)`;
        break;
      case `Z`:
        type = `Timestamp`;
        break;
      case `*`:
        type = `Pointer`;
        break;
      case ``:
        if (len != ``) {
          if (decimals == ``) {
            if (keywords.toUpperCase().indexOf(`VARYING`) >= 0) {
              keywords = keywords.replace(/varying/ig, ``);
              type = `Varchar`;
            } else {
              type = `Char`;
            }
            type += `(` + len + `)`;
          } else {
            if (isSubf) {
              type = `Zoned` + `(` + len + `:` + decimals + `)`;
            } else {
              type = `Packed` + `(` + len + `:` + decimals + `)`;
            }
          }
        }
        break;
      }

      switch (field) {
      case `C`:
        output.value = `Dcl-C ` + name.padEnd(10) + ` ` + keywords;
        break;
      case `S`:
        output.value = `Dcl-S ` + name.padEnd(12) + ` ` + type.padEnd(10) + ` ` + keywords;
        break;
      case `DS`:
      case `PR`:
      case `PI`:
        if (field == `DS` && input.substr(23, 1).trim().toUpperCase() == `S`)
          keywords = `PSDS ` + keywords;

        if (keywords.toUpperCase().indexOf(`QUALIFIED`) === -1)
          DSisQualified = false;

        if (keywords.toUpperCase().indexOf(`LIKEDS`) === -1)
          DSisLIKEDS = false;

        if (name == ``) name = `*N`;
        isSubf = (field == `DS`);
        output.value = `Dcl-` + field + ` ` + name + ` ` + type + ` ` + keywords;

	      if (DSisLIKEDS = false) {
          output.isSub = true;
        }
        output.blockType = field;
        blockType = field;

        output.nextSpaces = indent;
        break;
      case ``:
        output.isSub = true;
        if (name == ``) name = `*N`;
        if (name == `*N` && type == ``) {
          output.aboveKeywords = keywords;
          output.remove = true;
          output.blockType = blockType;
        } else {
          //(isSubf ? "Dcl-Subf" : "Dcl-Parm")
          output.value = name.padEnd(14) + ` ` + type.padEnd(10) + ` ` + keywords;

          output.blockType = blockType;

          if (!DSisQualified)
            output.var.standalone = true;
        }
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