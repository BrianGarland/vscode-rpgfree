let isSubf = false;
let prevName = '';
let blockType = '';

export function Parse(input, indent, wasSub, wasLIKEDS) {
  const output = {
    remove: false,
    change: false,
    value: '',

    beforeSpaces: 0,
    nextSpaces: 0,

    var: {
      standalone: false,
      name: '',
      type: '',
      len: 0
    }
  };

  const potentialName = input.substring(7).trim();
  let name = input.substring(7, 22).trim();
  const pos = input.substring(30, 33).trim();
  let len = input.substring(33, 40).trim();
  let type = input.substring(40, 41).trim();
  const decimals = input.substring(41, 44).trim();
  const field = input.substring(24, 26).trim().toUpperCase();
  let keywords = input.substring(44).trim().toUpperCase();
  let doCheck = false;
  let doneCheck = false;
  let extname = -1;

  output.var.standalone = (field === 'S');
  output.var.name = name;
  output.var.type = type;
  output.var.len = Number(len);

  if (keywords.endsWith('+')) {
    keywords = keywords.slice(0, -1);
  }

  if ((type === '') && output.var.standalone) {
    if (decimals === '') {
      output.var.type = 'A'; //Character
    } else {
      output.var.type = 'S'; //Zoned
    }
  }

  if (pos !== '') {
    len = String(Number(len) - Number(pos) + 1);
    keywords = `Pos(${pos}) ${keywords}`;
  }

  if (prevName !== '') {
    name = prevName;
    prevName = '';
  }

  if (potentialName.endsWith('...')) {
    prevName = potentialName.slice(0, -3);
    output.remove = true;
    if (wasSub) {
      output.isSub = true;
    }
  }

  if ((field === 'C') || (field === 'S')) {
    isSubf = false;
  }

  if (output.remove === false) {
    switch (type.toUpperCase()) {
      case 'A':
        if (keywords.indexOf('VARYING') >= 0) {
          keywords = keywords.replace(/VARYING/g, '');
          type = 'Varchar';
        } else {
          type = 'Char';
        }
        type += `(${len})`;
        break;

      case 'B':
        if (pos !== '') {
          // When using positions binary decimal is only 2 or 4
          // This equates to 4 or 9 in free
          if (Number(len) === 4) {
            type = 'Bindec(9)';
          } else {
            type = 'Bindec(4)';
          }
        } else {
          // Not using positions, then the length is correct
          type = `Bindec(${len})`;
        }
        break;

      case 'C':
        type = `Ucs2(${len})`;
        break;

      case 'D':
        if (keywords.indexOf('DATFMT') >= 0) {
          // If a date format was provided we need to remove DATFMT(xxxx) from keywords
          // and add what ever (xxxx) was to type
          const start = keywords.indexOf('DATFMT');
          const stop = keywords.indexOf(')');
          type = `Date${keywords.substring(start + 6, stop + 1)}`;
          if (start === 0) {
            keywords = keywords.substring(stop + 1).trim();
          } else {
            keywords = `${keywords.substring(0, start - 1).trim()} ${keywords.substring(stop + 1).trim()}`;
          }
        } else {
          type = 'Date';
        }
        break;

      case 'F':
        type = `Float(${len})`;
        break;

      case 'G':
        if (keywords.indexOf('VARYING') >= 0) {
          keywords = keywords.replace(/VARYING/g, '');
          type = 'Vargraph';
        } else {
          type = 'Graph';
        }
        type += `(${len})`;
        break;

      case 'I':
        switch (len) {
          case '1':
            type = 'Int(3)';
            break;
          case '2':
            type = 'Int(5)';
            break;
          case '4':
            type = 'Int(10)';
            break;
          case '8':
            type = 'Int(20)';
            break;
          default:
            type = `Int(${len})`;
        }
        break;

      case 'N':
        type = 'Ind';
        break;

      case 'P':
        if (pos !== '') {
          // When using positions packed length is one less than double the bytes
          type = `Packed(${String(Number(len) * 2 - 1)}:${decimals})`;
        } else {
          // Not using positions, then the length is correct
          type = `Packed(${len}:${decimals})`;
        }
        break;

      case 'S':
        type = `Zoned(${len}:${decimals})`;
        break;

      case 'T':
        if (keywords.indexOf('TIMFMT') >= 0) {
          // If a date format was provided we need to remove TIMFMT(xxxx) from keywords
          // and add what ever (xxxx) was to type
          const start = keywords.indexOf('TIMFMT');
          const stop = keywords.indexOf(')');
          type = `Time${keywords.substring(start + 6, stop + 1)}`;
          if (start === 0) {
            keywords = keywords.substring(stop + 1).trim();
          } else {
            keywords = `${keywords.substring(0, start - 1).trim()} ${keywords.substring(stop + 1).trim()}`;
          }
        } else {
          type = 'Time';
        }
        break;

      case 'U':
        switch (len) {
          case '1':
            type = 'Uns(3)';
            break;
          case '2':
            type = 'Uns(5)';
            break;
          case '4':
            type = 'Uns(10)';
            break;
          case '8':
            type = 'Uns(20)';
            break;
          default:
            type = `Uns(${len})`;
        }
        break;

      case 'Z':
        type = 'Timestamp';
        break;

      case '*':
        const index = keywords.indexOf('PROCPTR');
        if (index >= 0) {
          const removeText = keywords.substring(index, index + 7);
          keywords = keywords.replace(removeText, '');
          type = 'Pointer(*PROC)';
        } else {
          type = 'Pointer';
        }
        break;

      case '':
        if (field === 'DS' && output.var.len !== 0) {
          type = `Len(${len})`;
        } else if (len !== '') {
          if (decimals === '') {
            if (keywords.indexOf('VARYING') >= 0) {
              keywords = keywords.replace(/VARYING/g, '');
              type = 'Varchar';
            } else {
              type = 'Char';
            }
            type += `(${len})`;
          } else {
            if (isSubf) {
              type = `Zoned(${len}:${decimals})`;
            } else {
              type = `Packed(${len}:${decimals})`;
            }
          }
        }
        break;
    }

    switch (field) {
      case 'C':
        output.value = `Dcl-C ${name.padEnd(10)} ${keywords}`;
        break;

      case 'S':
        output.value = `Dcl-S ${name.padEnd(12)} ${type.padEnd(10)} ${keywords}`;
        break;

      case 'DS':
      case 'PR':
      case 'PI':
        const dsType = input.substring(23, 24).trim().toUpperCase();
        if (field === 'DS') {
          if (dsType === 'S') {
            keywords = `PSDS ${keywords}`;
          } else if (dsType === 'U') {
            keywords = `DTAARA(*AUTO) ${keywords}`;
          }
        }

        const DSisLIKEDS = keywords.indexOf('LIKEDS') >= 0;
        output.isLIKEDS = DSisLIKEDS;

        if (name === '') {
          name = '*N';
        }

        isSubf = (field === 'DS');
        output.isSub = (DSisLIKEDS === false);
        output.isHead = true;

        // if keywords contain 'EXTNAME' add apostrophes around name
        extname = keywords.indexOf('EXTNAME');
        if (extname !== -1) {
          let tempkeywords = keywords;
          keywords = '';
          output.isSub = true;
          for (var i = 0; i < tempkeywords.length; i++) {
            if (i > extname && !doneCheck) {
              doCheck = true;
            }
            if (doCheck && tempkeywords.substring(i, i + 1) === ')') {
              keywords += "'";
              doCheck = false;
              doneCheck = true;
            }
            keywords += tempkeywords.substring(i, i + 1);
            if (doCheck && tempkeywords.substring(i, i + 1) === '(') {
              keywords += "'";
            }
          }
        }

        output.value = `Dcl-${field} ${name} ${type} ${keywords}`;

        if (DSisLIKEDS === false) {
          output.isSub = true;
          output.nextSpaces = indent;
        }
        output.blockType = field;
        blockType = field;
        break;

      case '':
        output.isSub = (wasLIKEDS === false);
        if (name === '') {
          name = '*N';
        }
        if (name === '*N' && type === '') {
          output.aboveKeywords = keywords;
          output.remove = true;
          output.blockType = blockType;
        } else {
          //(isSubf ? "Dcl-Subf" : "Dcl-Parm")
          output.value = `${name.padEnd(14)} ${type.padEnd(10)} ${keywords}`;
          output.blockType = blockType;
        }
        break;
    }
  }

  if (output.value !== '') {
    output.change = true;
    output.value = `${output.value.trimRight()};`;
  }
  return output;
}
