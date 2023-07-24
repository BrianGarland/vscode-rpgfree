let LastKey = ``;
let Lists = {};
let doingCALL = false;
let doingENTRY = false;

let EndList = [];

module.exports = {
  Parse: function (input, indent, wasSub) {
    let output = {
      remove: false,
      change: false,
      value: ``,

      beforeSpaces: 0,
      nextSpaces: 0
    };

    let spaces = 0;
    let sep = ``;

    let factor1 = input.substr(12, 14).trim();
    let opcode = input.substr(26, 10).trim().toUpperCase();
    let plainOp = ``;
    let extender = ``;
    let factor2 = input.substr(36, 14).trim();
    let extended = input.substr(36).trim();
    let result = input.substr(50, 14).trim();

    let ind1 = input.substr(71, 2).trim();
    let ind2 = input.substr(73, 2).trim();
    let ind3 = input.substr(75, 2).trim();

    let period = ``;

    let condition = {
      not: (input.substr(9, 1).toUpperCase() === `N`),
      ind: input.substr(10, 2).trim()
    };

    let levelBreak = (input.substr(7, 1).toUpperCase() === `L`);

    let arrayoutput = [];

    plainOp = opcode;
    if (plainOp.indexOf(`(`) >= 0) {
      plainOp = opcode.substr(0, opcode.indexOf(`(`));
      extender = opcode.substring(opcode.indexOf(`(`) + 1, opcode.indexOf(`)`));
    }

    if (doingCALL && plainOp != `PARM`) {
      doingCALL = false;
      arrayoutput.push(LastKey + `(` + Lists[LastKey].join(`:`) + `);`);
    }

    if (doingENTRY && plainOp != `PARM`) {
      doingENTRY = false;
    }

    let sqltest1 = input.substr(7, 9).trim().toUpperCase();
    let sqltest2 = input.substr(7, 1).trim().toUpperCase();
    let fixedSql = false;

    if (sqltest1 == '/EXEC SQL') {
      output.value = ``.padEnd(7) + input.substr(8).trim();
      fixedSql = true;
      condition.ind = ``;
    } else if (sqltest1 == '/END-EXEC') {
      output.value = ``.padEnd(7);
      condition.ind = ``;
    } else if (sqltest2 == '+') {
      output.value = ``.padEnd(7) + input.substr(8).trim();
      fixedSql = true;
    } else if (levelBreak) {
      // Leave this statement alone
      output.ignore = true;
    } else {
      switch (plainOp) {
        case `PLIST`:
        case `KLIST`:
          LastKey = factor1.toUpperCase();
          Lists[LastKey] = [];
          if (plainOp == `PLIST` && factor1.toUpperCase() == `*ENTRY`) {
            doingENTRY = true;
          } else {
            output.remove = true;
          }
          break;
        case `PARM`:
        case `KFLD`:
          //Handle var declaration
          if (doingENTRY) {
            break;
          }
          Lists[LastKey].push(result);
          output.remove = true;
          break;
        case `ACQ`:
          output.value = opcode + ` ` + factor1 + ` ` + factor2;
          break;
        case `ADD`:
          if (factor1) {
            output.value = result + ` = ` + factor1 + ` + ` + factor2;
          } else {
            output.value = result + ` = ` + result + ` + ` + factor2;
          }
          break;
        case `ADDDUR`:
          // We are adding a duration to a date
          switch (factor2.split(`:`)[1]) {
            case `*DAYS`:
            case `*DAY`:
            case `*D`:
              period = `%DAYS`;
              break;
            case `*MONTHS`:
            case `*MONTH`:
            case `*M`:
              period = `%MONTHS`;
              break;
            case `*YEARS`:
            case `*YEAR`:
            case `*Y`:
              period = `%YEARS`;
              break;
          }
          if (factor1) {
            output.value = result + ` = ` + factor1 + ` + ` + period + `(` + factor2.split(`:`)[0] + `)`;
          } else {
            output.value = result + ` += ` + period + `(` + factor2.split(`:`)[0] + `)`;
          }
          break;
        case `ANDEQ`:
          output.aboveKeywords = `AND ` + factor1 + ` = ` + factor2;
          break;
        case `ANDNE`:
          output.aboveKeywords = `AND ` + factor1 + ` <> ` + factor2;
          break;
        case `ANDLE`:
          output.aboveKeywords = `AND ` + factor1 + ` <= ` + factor2;
          break;
        case `ANDLT`:
          output.aboveKeywords = `AND ` + factor1 + ` < ` + factor2;
          break;
        case `ANDGE`:
          output.aboveKeywords = `AND ` + factor1 + ` >= ` + factor2;
          break;
        case `ANDGT`:
          output.aboveKeywords = `AND ` + factor1 + ` > ` + factor2;
          break;
        case `BEGSR`:
          output.value = opcode + ` ` + factor1;
          output.nextSpaces = indent;
          break;
        case `CALL`:
          factor2 = factor2.substring(1, factor2.length - 1);
          // result may containe a PLIST name
          if (result != ``) {
            if (Lists[result.toUpperCase()]) {
              output.value = factor2 + `(` + Lists[result.toUpperCase()].join(`:`) + `)`;
            }
          } else {
            output.remove = true;
            LastKey = factor2.toUpperCase();
            Lists[LastKey] = [];
            doingCALL = true;
          }
          break;
        case `CALLB`:
        case `CALLP`:
          output.value = extended;
          break;
        case `CAT`:
          if (factor2.indexOf(`:`) >= 0) {
            spaces = Number(factor2.split(`:`)[1]);
            factor2 = factor2.split(`:`)[0].trim();
          }
          output.value = result + ` = ` + factor1 + `+ '` + ``.padStart(spaces) + `' + ` + factor2;
          break;
        case `CHAIN`:
          if (Lists[factor1.toUpperCase()]) {
            output.value = opcode + ` (` + Lists[factor1.toUpperCase()].join(`:`) + `) ` + factor2 + ` ` + result;
          } else {
            output.value = opcode + ` ` + factor1 + ` ` + factor2 + ` ` + result;
          }
          // apply indicators
          if (ind1 != ``) {
            output.value += `;\n       *in` + ind1 + ' = (%found() = *Off)'
          }
          if (ind2 != ``) {
            output.value += `;\n       *in` + ind1 + ' = %error()'
          }
          break;
        case `CHECK`:
          output.value = result + ` = %Check(` + factor1 + `:` + factor2 + `)`;
          break;
        case `CHECKR`:
          output.value = result + ` = %CheckR(` + factor1 + `:` + factor2 + `)`;
          break;
        case `CLEAR`:
          output.value = opcode + ` ` + factor1 + ` ` + factor2 + ` ` + result;
          break;
        case `CLOSE`:
          output.value = opcode + ` ` + factor2;
          break;
        case `DELETE`:
          if (Lists[factor1.toUpperCase()]) {
            output.value = opcode + ` (` + Lists[factor1.toUpperCase()].join(`:`) + `) ` + factor2;
          } else if (factor1 != ``) {
            output.value = opcode + ` ` + factor1 + ` ` + factor2;
          } else {
            output.value = opcode + ` ` + factor2;
          }
          break;
        case `DIV`:
          output.value = result + ` = ` + factor1 + ` / ` + factor2;
          break;
        case `DO`:
          if (condition.ind != ``) {
            output.value = `If *in` + condition.ind.toUpperCase() + ` = ` + ((condition.not == true) ? '*Off' : '*On');
            output.nextSpaces = indent;
            EndList.push(`Endif`);
            condition.ind = ``;
          }
          else {
            output.value = `For ` + result + ` = ` + factor1 + ` to ` + factor2;
            output.nextSpaces = indent;
            EndList.push(`Enddo`);
          }
          break;
        case `DOU`:
        case `DOW`:
          output.value = opcode + ` ` + extended;
          output.nextSpaces = indent;
          EndList.push(`Enddo`);
          break;
        case `DOUEQ`:
          output.value = `Dou ` + factor1 + ` = ` + factor2;
          output.nextSpaces = indent;
          EndList.push(`Enddo`);
          break;
        case `DOUNE`:
          output.value = `Dou ` + factor1 + ` <> ` + factor2;
          output.nextSpaces = indent;
          EndList.push(`Enddo`);
          break;
        case `DOUGT`:
          output.value = `Dou ` + factor1 + ` > ` + factor2;
          output.nextSpaces = indent;
          EndList.push(`Enddo`);
          break;
        case `DOULT`:
          output.value = `Dou ` + factor1 + ` < ` + factor2;
          output.nextSpaces = indent;
          EndList.push(`Enddo`);
          break;
        case `DOUGE`:
          output.value = `Dou ` + factor1 + ` >= ` + factor2;
          output.nextSpaces = indent;
          EndList.push(`Enddo`);
          break;
        case `DOULE`:
          output.value = `Dou ` + factor1 + ` <= ` + factor2;
          output.nextSpaces = indent;
          EndList.push(`Enddo`);
          break;
        case `DOWEQ`:
          output.value = `Dow ` + factor1 + ` = ` + factor2;
          output.nextSpaces = indent;
          EndList.push(`Enddo`);
          break;
        case `DOWNE`:
          output.value = `Dow ` + factor1 + ` <> ` + factor2;
          output.nextSpaces = indent;
          EndList.push(`Enddo`);
          break;
        case `DOWGT`:
          output.value = `Dow ` + factor1 + ` > ` + factor2;
          output.nextSpaces = indent;
          EndList.push(`Enddo`);
          break;
        case `DOWLT`:
          output.value = `Dow ` + factor1 + ` < ` + factor2;
          output.nextSpaces = indent;
          EndList.push(`Enddo`);
          break;
        case `DOWGE`:
          output.value = `Dow ` + factor1 + ` >= ` + factor2;
          output.nextSpaces = indent;
          EndList.push(`Enddo`);
          break;
        case `DOWLE`:
          output.value = `Dow ` + factor1 + ` <= ` + factor2;
          output.nextSpaces = indent;
          EndList.push(`Enddo`);
          break;
        case `DSPLY`:
          output.value = opcode + ` (` + factor1 + `) ` + factor2 + ` ` + result;
          break;
        case `DUMP`:
          output.value = opcode + ` ` + factor1;
          break;
        case `ELSE`:
          output.beforeSpaces = -indent;
          output.value = opcode + ` ` + factor2;
          output.nextSpaces = indent;
          break;
        case `ELSEIF`:
          output.beforeSpaces = -indent;
          output.value = opcode + ` ` + factor2;
          output.nextSpaces = indent;
          break;
        case `END`:
          if (EndList.length > 0) {
            output.beforeSpaces = -indent;
            output.value = EndList.pop();
          } else {
            output.message = `Operation ` + plainOp + ` will not convert; no matching block found.`;
          }
          break;
        case `ENDDO`:
          output.beforeSpaces = -indent;
          output.value = opcode;
          EndList.pop()
          break;
        case `ENDIF`:
          output.beforeSpaces = -indent;
          output.value = opcode;
          EndList.pop()
          break;
        case `ENDMON`:
          output.beforeSpaces = -indent;
          output.value = opcode;
          break;
        case `ENDSL`:
          output.beforeSpaces = -(indent * 2);
          output.value = opcode;
          EndList.pop()
          break;
        case `ENDSR`:
          output.beforeSpaces = -indent;
          output.value = opcode;
          break;
        case `EVAL`:
          output.value = extended;
          break;
        case `EVALR`:
          output.value = opcode + ` ` + extended;
          break;
        case `EVAL-CORR`:
          output.value = opcode + ` ` + extended;
          break;
        case `EXCEPT`:
          output.value = opcode + ` ` + factor2;
          break;
        case `EXFMT`:
          output.value = opcode + ` ` + factor2;
          break;
        case `EXSR`:
          output.value = opcode + ` ` + factor2;
          break;
        case `FOR`:
          output.value = opcode + ` ` + extended;
          output.nextSpaces = indent;
          break;
        case `IF`:
          output.value = opcode + ` ` + extended;
          output.nextSpaces = indent;
          EndList.push(`Endif`);
          break;
        case `IFGT`:
          output.value = `If ` + factor1 + ` > ` + factor2;
          output.nextSpaces = indent;
          EndList.push(`Endif`);
          break;
        case `IFLT`:
          output.value = `If ` + factor1 + ` < ` + factor2;
          output.nextSpaces = indent;
          EndList.push(`Endif`);
          break;
        case `IFEQ`:
          output.value = `If ` + factor1 + ` = ` + factor2;
          output.nextSpaces = indent;
          EndList.push(`Endif`);
          break;
        case `IFNE`:
          output.value = `If ` + factor1 + ` <> ` + factor2;
          output.nextSpaces = indent;
          EndList.push(`Endif`);
          break;
        case `IFGE`:
          output.value = `If ` + factor1 + ` >= ` + factor2;
          output.nextSpaces = indent;
          EndList.push(`Endif`);
          break;
        case `IFLE`:
          output.value = `If ` + factor1 + ` <= ` + factor2;
          output.nextSpaces = indent;
          EndList.push(`Endif`);
          break;
        case `IN`:
          output.value = opcode + ` ` + factor1 + ` ` + factor2;
          break;
        case `ITER`:
          output.value = opcode;
          break;
        case `LEAVE`:
          output.value = opcode;
          break;
        case `LEAVESR`:
          output.value = opcode;
          break;
        case `LOOKUP`:
          // if factor2 has a paren then need to split that value out
          if (factor2.indexOf(`(`) >= 0) {
            let array = factor2.substr(0, factor2.indexOf(`(`));
            let index = factor2.substring(factor2.indexOf(`(`) + 1, factor2.indexOf(`)`));
            output.value = `*In` + ind3 + ` = (%Lookup(` + factor1 + `:` + array + `:` + index + `) > 0)`;
          } else {
            output.value = `*In` + ind3 + ` = (%Lookup(` + factor1 + `:` + factor2 + `) > 0)`;
          }
          break;
        case `MONITOR`:
          output.value = opcode;
          output.nextSpaces = indent;
          break;
        case `MOVE`:
        case `MOVEL`:
          // output.move = {
          //   target: result,
          //   source: factor2,
          //   attr: factor1,
          //   dir: plainOp,
          //   padded: (extender === `P`)
          // }
          output.ignore = true;
          break;
        case `MULT`:
          output.value = result + ` = ` + factor1 + ` * ` + factor2;
          break;
        case `ON-ERROR`:
          output.beforeSpaces = -indent;
          output.value = opcode + ` ` + factor2;
          output.nextSpaces = indent;
          break;
        case `OPEN`:
          output.value = opcode + ` ` + factor2;
          break;
        case `OREQ`:
          output.aboveKeywords = `OR ` + factor1 + ` = ` + factor2;
          break;
        case `ORNE`:
          output.aboveKeywords = `OR ` + factor1 + ` <> ` + factor2;
          break;
        case `ORLE`:
          output.aboveKeywords = `OR ` + factor1 + ` <= ` + factor2;
          break;
        case `ORLT`:
          output.aboveKeywords = `OR ` + factor1 + ` < ` + factor2;
          break;
        case `ORGE`:
          output.aboveKeywords = `OR ` + factor1 + ` >= ` + factor2;
          break;
        case `ORGT`:
          output.aboveKeywords = `OR ` + factor1 + ` > ` + factor2;
          break;
        case `OTHER`:
          output.beforeSpaces = -indent;
          output.value = opcode;
          output.nextSpaces = indent;
          break;
        case `OUT`:
          output.value = opcode + ` ` + factor1 + ` ` + factor2;
          break;
        case `READ`:
        case `READC`:
          output.value = opcode + ` ` + factor2 + ` ` + result;

          // process indicators
          if (ind2 != "") {
            output.value += `;\n       *in` + ind2 + ' = %error()';
          }
          if (ind3 != "") {
            output.value += `;\n       *in` + ind3 + ' = %eof()';
          }
          break;
        case `READE`:
          if (Lists[factor1.toUpperCase()]) {
            output.value = opcode + ` (` + Lists[factor1.toUpperCase()].join(`:`) + `) ` + factor2 + ` ` + result;
          } else {
            output.value = opcode + ` ` + factor1 + ` ` + factor2 + ` ` + result;
          }
          break;
        case `READP`:
          output.value = opcode + ` ` + factor2 + ` ` + result;
          break;
        case `READPE`:
          if (Lists[factor1.toUpperCase()]) {
            output.value = opcode + ` (` + Lists[factor1.toUpperCase()].join(`:`) + `) ` + factor2 + ` ` + result;
          } else {
            output.value = opcode + ` ` + factor1 + ` ` + factor2 + ` ` + result;
          }
          break;
        case `RESET`:
          output.value = opcode + ` ` + factor1 + ` ` + factor2 + ` ` + result;
          break;
        case `RETURN`:
          output.value = opcode + ` ` + factor2;
          break;
        case `SCAN`:
          output.value = result + ` = %Scan(` + factor1 + `:` + factor2 + `)`;
          break;
        case `SELECT`:
          output.value = opcode;
          output.nextSpaces = (indent * 2);
          EndList.push(`Endsl`);
          break;
        case `SETGT`:
          if (Lists[factor1.toUpperCase()]) {
            output.value = opcode + ` (` + Lists[factor1.toUpperCase()].join(`:`) + `) ` + factor2;
          } else {
            output.value = opcode + ` ` + factor1 + ` ` + factor2;
          }
          // apply indicators
          if (ind1 != ``) {
            output.value += `;\n       *in` + ind1 + ' = (%found() = *Off)'
          }
          if (ind2 != ``) {
            output.value += `;\n       *in` + ind1 + ' = %error()'
          }
          break;
        case `SETLL`:
          if (Lists[factor1.toUpperCase()]) {
            output.value = opcode + ` (` + Lists[factor1.toUpperCase()].join(`:`) + `) ` + factor2;
          } else {
            output.value = opcode + ` ` + factor1 + ` ` + factor2;
          }
          // apply indicators
          if (ind1 != ``) {
            output.value += `;\n       *in` + ind1 + ' = (%found() = *Off)'
          }
          if (ind2 != ``) {
            output.value += `;\n       *in` + ind1 + ' = %error()'
          }
          if (ind3 != ``) {
            output.value += `;\n       *in` + ind1 + ' = %equal()'
          }
          break;
        case `SETOFF`:
          if (ind1 != ``) {
            arrayoutput.push(`*In` + ind1 + ` = *Off;`);
          }
          if (ind2 != ``) {
            arrayoutput.push(`*In` + ind2 + ` = *Off;`);
          }
          if (ind3 != ``) {
            arrayoutput.push(`*In` + ind3 + ` = *Off;`);
          }
          break;
        case `SETON`:
          if (ind1 != ``) {
            arrayoutput.push(`*In` + ind1 + ` = *On;`);
          }
          if (ind2 != ``) {
            arrayoutput.push(`*In` + ind2 + ` = *On;`);
          }
          if (ind3 != ``) {
            arrayoutput.push(`*In` + ind3 + ` = *On;`);
          }
          break;
        case `SORTA`:
          output.value = opcode + ` ` + extended;
          break;
        case 'SQRT':
          output.value = result + ` = %SQRT(` + factor2 + `)`;
          break;
        case `SUB`:
          if (factor1) {
            output.value = result + ` = ` + factor1 + ` - ` + factor2;
          } else {
            output.value = result + ` = ` + result + ` - ` + factor2;
          }
          break;
        case `SUBDUR`:
          // If factor2 has a : then it is a duration and we are doing subtacting a duriation from a date
          if (factor2.includes(`:`)) {
            switch (factor2.split(`:`)[1]) {
              case `*DAYS`:
              case `*DAY`:
              case `*D`:
                period = `%DAYS`;
                break;
              case `*MONTHS`:
              case `*MONTH`:
              case `*M`:
                period = `%MONTHS`;
                break;
              case `*YEARS`:
              case `*YEAR`:
              case `*Y`:
                period = `%YEARS`;
                break;
            }
            if (factor1) {
              output.value = result + ` = ` + factor1 + ` - ` + period + `(` + factor2.split(`:`)[0] + `)`;
            } else {
              output.value = result + ` -= ` + period + `(` + factor2.split(`:`)[0] + `)`;
            }
          } else {
            // If factor2 doesn't have a duration then we are finding the duration between two dates
            output.value = result.split(`:`)[0] + ` = %DIFF(` + factor1 + `:` + factor2 + `:` + result.split(`:`)[1] + `)`;
          }
          break;
        case `SUBST`:
          if (factor2.indexOf(`:`) >= 0) {
            sep = factor2.split(`:`)[1];
            factor2 = factor2.split(`:`)[0].trim();
          }
          if (factor1.trim().length == 0) {
            output.value = result + ` = %Subst(` + factor2 + `:` + sep + `)`;
          } else {
            output.value = result + ` = %Subst(` + factor2 + `:` + sep + `:` + factor1 + `)`;
          }
          break;
        case `TIME`:
          output.value = result + ` = %Time()`;
          break;
        case `UNLOCK`:
          output.value = opcode + ` ` + factor2;
          break;
        case `UPDATE`:
          output.value = opcode + ` ` + factor2 + ` ` + result;
          break;
        case `WHEN`:
          output.beforeSpaces = -indent;
          output.value = opcode + ` ` + extended;
          output.nextSpaces = indent;
          break;
        case `WHENEQ`:
          output.beforeSpaces = -indent;
          output.value = `When ` + factor1 + ` = ` + factor2;
          output.nextSpaces = indent;
          break;
        case `WHENNE`:
          output.beforeSpaces = -indent;
          output.value = `When ` + factor1 + ` <> ` + factor2;
          output.nextSpaces = indent;
          break;
        case `WHENLT`:
          output.beforeSpaces = -indent;
          output.value = `When ` + factor1 + ` < ` + factor2;
          output.nextSpaces = indent;
          break;
        case `WHENLE`:
          output.beforeSpaces = -indent;
          output.value = `When ` + factor1 + ` <= ` + factor2;
          output.nextSpaces = indent;
          break;
        case `WHENGT`:
          output.beforeSpaces = -indent;
          output.value = `When ` + factor1 + ` > ` + factor2;
          output.nextSpaces = indent;
          break;
        case `WHENGE`:
          output.beforeSpaces = -indent;
          output.value = `When ` + factor1 + ` >= ` + factor2;
          output.nextSpaces = indent;
          break;
        case `WRITE`:
          output.value = opcode + ` ` + factor2 + ` ` + result;
          break;
        case 'XFOOT':
          output.value = result + ` = %XFOOT(` + factor2 + `)`;
          break;
        case 'XLATE':
          output.value = result + ` = %XLATE(` + factor1 + `:` + factor2 + `)`;
          break;
        case `Z-ADD`:
          output.value = result + ` = ` + factor2;
          break;
        case `Z-SUB`:
          output.value = result + ` = -` + factor2;
          break;

        default:
          if (plainOp == ``) {
            if (extended !== ``) {
              output.aboveKeywords = extended;
            } else {
              //Set to blank
              output.change = true;
              output.value = ``;
            }
          } else {
            output.message = `Operation ` + plainOp + ` will not convert.`;
            output.ignore = true;
          }
          break;
      }
    }


    if (output.value !== ``) {
      output.change = true;
      if (!fixedSql) {
        output.value = output.value.trimEnd() + `;`;
      }
    }

    if (!fixedSql && condition.ind !== `` && output.change) {
      arrayoutput.push(`If` + (condition.not ? ` NOT` : ``) + ` *In` + condition.ind + `;`);
      arrayoutput.push(`  ` + output.value);
      arrayoutput.push(`Endif;`);
      output.value = ``;
    }

    if (arrayoutput.length > 0) {
      output.change = true;
      if (output.value !== ``) {
        arrayoutput.push(`  ` + output.value);
        output.Value = ``;
      }
      output.arrayoutput = arrayoutput;
    }
    return output;
  }
}
