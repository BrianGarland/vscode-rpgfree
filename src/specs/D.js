const { Console } = require("console");
const { CommentThreadCollapsibleState } = require("vscode");

let isSubf = false;
let prevName = ``;
let blockType = ``;

module.exports = {
  Parse: function (input, indent, wasSub, wasLIKEDS) {
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
    let name = input.substr(7, 15).trim();
    let pos = input.substr(30, 3).trim();
    let len = input.substr(33, 7).trim();
    let type = input.substr(40, 1).trim();
    let decimals = input.substr(41, 3).trim();
    let field = input.substr(24, 2).trim().toUpperCase();
    let keywords = input.substr(44).trim();
    let reservedWord = input.substr(26, 14).trim().toUpperCase();
    let doCheck = false;
    let doneCheck = false;
    let tempkeywords = ``;
    let isReservedWord = (reservedWord.substr(0, 1) === `*`);

    // If this is a reserved word (e.g., *PROC, *STATUS), force
    //  the pos and len to empty strings.
    if (isReservedWord === true) {
      pos = ``;
      len = ``;
    }

    // If this field is a LIKE with a +/- adjustment, force the
    //  type to an empty string.
    let isLikeWithAdjustedLength = (len.indexOf(`+`) !== -1 || len.indexOf(`-`) !== -1) && (keywords.toUpperCase().indexOf(`LIKE`) !== -1);
    if (isLikeWithAdjustedLength) {
      type = '';
    }

    output.var.standalone = (field === `S`);
    output.var.name = name;
    output.var.type = type;
    output.var.len = Number(len);

    if (keywords.endsWith(`+`)) {
      keywords = keywords.substr(0, keywords.length-1);
    }

    if ((type == ``) && output.var.standalone && (!isLikeWithAdjustedLength)) {
      if (decimals == ``)
        output.var.type = `A`; // Character
      else
        output.var.type = `S`; // Zoned
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
      output.blockType = blockType;
    }

    if ((field == `C`) || (field == `S`)) {
        isSubf = false;
    }

    if (output.remove === false) {
      switch (type.toUpperCase()) {
      case `A`:
        type = `Char`;
        type += `(` + len + `)`;
        break;
      case `B`:
        if (pos != ``) {
          // When using positions binary decimal is only 2 or 4 
          // This equates to 4 or 9 in free
          if (Number(len) == 4) {
            type = `Bindec(9)`;
          } else {
            type = `Bindec(4)`;
          }    
        } else {
          // Not using positions, then the length is correct
          type = `Bindec` + `(` + len + `)`;
        }
        break;
      case `C`:
        type = `Ucs2` + `(` + len + `)`;
        break;  
      case `D`:
        if (keywords.toUpperCase().indexOf(`DATFMT`) >= 0) {
          // If a date format was provided we need to remove DATFMT(xxxx) from keywords
          // and add what ever (xxxx) was to type
          let start = keywords.toUpperCase().indexOf(`DATFMT`);
          let stop =  keywords.toUpperCase().indexOf(`)`);
          type = `Date` + keywords.substr(start+6,stop-(start+6)+1);
          if (start == 0) {
            keywords = keywords.substr(stop+1).trim();
          } else {
            keywords = keywords.substr(0,start-1).trim() + ` ` +keywords.substr(stop+1).trim();
          }
        } else {
          type = `Date`;
        }
        break;
      case `F`:
        type = `Float` + `(` + len + `)`;
        break;
      case `G`:
        type = `Graph`;
        type += `(` + len + `)`;
        break;
      case `I`:
        switch (len) {
          case '1':
            type = `Int(3)`;
            break;
          case '2':
            type = `Int(5)`;
            break;
          case '4':
            type = `Int(10)`;
            break;
          case '8':
            type = `Int(20)`;
            break;
          default:
            type = `Int(` + len + `)`;
        }
        break;
      case `N`:
        type = `Ind`;
        break;
      case `P`:
        if (pos != ``) {
          // When using positions packed length is one less than double the bytes
          type = `Packed` + `(` + String(Number(len)*2-1)  + `:` + decimals + `)`;
        } else {
          // Not using positions, then the length is correct
          type = `Packed` + `(` + len + `:` + decimals + `)`;
        }  
        break;
      case `S`:
        type = `Zoned` + `(` + len + `:` + decimals + `)`;
        break;
      case `T`:
        if (keywords.toUpperCase().indexOf(`TIMFMT`) >= 0) {
          // If a date format was provided we need to remove TIMFMT(xxxx) from keywords
          // and add what ever (xxxx) was to type
          let start = keywords.toUpperCase().indexOf(`TIMFMT`);
          let stop =  keywords.toUpperCase().indexOf(`)`);
          type = `Time` + keywords.substr(start+6,stop-(start+6)+1);
          if (start == 0) {
            keywords = keywords.substr(stop+1).trim();
          } else {
            keywords = keywords.substr(0,start-1).trim() + ` ` +keywords.substr(stop+1).trim();
          }
        } else {
          type = `Time`;
        }
        break;
      case `U`:
        switch (len) {
          case '1':
            type = `Uns(3)`;
            break;
          case '2':
            type = `uns(5)`;
            break;
          case '4':
            type = `Uns(10)`;
            break;
          case '8':
            type = `Uns(20)`;
            break;
          default:
            type = `Uns(` + len + `)`;
        }
        break;
      case `Z`:
        type = `Timestamp`;
        break;
      case `*`:
        let index = keywords.toUpperCase().indexOf(`PROCPTR`);
        if ( index >= 0) {
          let removeText = keywords.substr(index,7);
          keywords = keywords.replace(removeText,``);
          type = `Pointer(*PROC)`;
        } else {  
          type = `Pointer`;
        }
        break;
      case ``:
        if (field == `DS` && output.var.len != 0) {
          type = `Len(` + len + `)`;
        } else if (isReservedWord === true) {
          type = reservedWord;
        } else if (len != ``) {
          // If this is a LIKE field with adjustmented length, insert the
          //  +/- length into the LIKE keyword.
          if (isLikeWithAdjustedLength) {
            let likepos = keywords.toUpperCase().indexOf(`LIKE`);
            let closebracket = keywords.indexOf(`)`, likepos);
            keywords = keywords.slice(0,closebracket) + `: ` + len + keywords.slice(closebracket);
          } else if (decimals == ``) {
            type = `Char`;
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
        output.blockType = ``;
        blockType = ``;
        output.value = `Dcl-C ` + name.padEnd(10) + ` ` + keywords;
        break;

      case `S`:
        output.blockType = ``;
        blockType = ``;
        output.value = `Dcl-S ` + name.padEnd(12) + ` ` + type.padEnd(10) + ` ` + keywords;
        break;

      case `DS`:
      case `PR`:
      case `PI`:
        if (field == `DS` && input.substr(23, 1).trim().toUpperCase() == `S`)
          keywords = `PSDS ` + keywords;

        if (field == `DS` && input.substr(23, 1).trim().toUpperCase() == `U`)
          keywords = `DtaAra(*AUTO) ` + keywords;

        let DSisLIKEDS = (keywords.toUpperCase().indexOf(`LIKEDS`) >= 0);
        output.isLIKEDS = DSisLIKEDS;

        if (name == ``) 
          name = `*N`;

        isSubf = (field == `DS`);
        output.isSub = (DSisLIKEDS == false);
        output.isHead = true;

        output.value = `Dcl-` + field + ` ` + name + ` ` + type + ` ` + keywords;

	      if (DSisLIKEDS == false) {
          output.isSub = true;
          output.nextSpaces = indent;
        }
        output.blockType = field;
        blockType = field;
        break;

      case ``:
        output.isSub = (wasLIKEDS == false);
        if (name == ``) name = `*N`;
        if (name == `*N` && type == ``) {
          output.aboveKeywords = keywords;
          output.remove = true;
          output.blockType = blockType;
        } else {
          //(isSubf ? "Dcl-Subf" : "Dcl-Parm")
          output.value = name.padEnd(14) + ` ` + type.padEnd(10) + ` ` + keywords;
          output.blockType = blockType;
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