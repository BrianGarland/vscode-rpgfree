const { lookup } = require("dns");
const { wrap } = require("module");

const OPCODES = {
  "ACQ": "Acq",
  "ADD": "Add",
  "ADDDUR": "AddDur",
  "ALLOC": "Alloc",
  "AND": "And",
  "ANDEQ": "AndEq",
  "ANDGE": "AndGE",
  "ANDGT": "AndGT",
  "ANDLE": "AndLE",
  "ANDLT": "AndLT",
  "ANDNE": "AndNE",
  "BEGSR": "BegSr",
  "CALL": "Call",
  "CALLB": "CallB",
  "CALLP": "CallP",
  "CASEQ": "CasEq",
  "CASGE": "CasGE",
  "CASGT": "CasGT",
  "CASLE": "CasLE",
  "CASLT": "CasLT",
  "CASNE": "CasNE",
  "CAT": "Cat",
  "CHAIN": "Chain",
  "CHECK": "Check",
  "CHECKR": "CheckR",
  "CLEAR": "Clear",
  "CLOSE": "Close",
  "COMMIT": "Commit",
  "COMP": "Comp",
  "DEALLOC": "Dealloc",
  "DELETE": "Delete",
  "DIV": "Div",
  "DO": "Do",
  "DOU": "DoU",
  "DOUEQ": "DoUEq",
  "DOUGE": "DoUGE",
  "DOUGT": "DoUGT",
  "DOULE": "DoULE",
  "DOULT": "DoULT",
  "DOUNE": "DoUNE",
  "DOW": "DoW",
  "DOWEQ": "DoWEq",
  "DOWGE": "DoWGE",
  "DOWGT": "DoWGT",
  "DOWLE": "DoWLE",
  "DOWLT": "DoWLT",
  "DOWNE": "DoWNE",
  "DSPLY": "Dsply",
  "DUMP": "Dump",
  "ELSE": "Else",
  "ELSEIF": "ElseIf",
  "END": "End",
  "ENDCS": "EndCs",
  "ENDDO": "EndDo",
  "ENDFOR": "EndFor",
  "ENDIF": "EndIf",
  "ENDMON": "EndMon",
  "ENDSL": "EndSl",
  "ENDSR": "EndSr",
  "EVAL": "Eval",
  "EVAL-CORR": "Eval-Corr",
  "EVALR": "EvalR",
  "EXCEPT": "Except",
  "EXFMT": "ExFmt",
  "EXSR": "ExSr",
  "FEOD": "FEod",
  "FOR": "For",
  "FORCE": "Force",
  "IF": "If",
  "IFEQ": "IfEq",
  "IFGE": "IfGE",
  "IFGT": "IfGT",
  "IFLE": "IfLE",
  "IFLT": "IfLT",
  "IFNE": "IfNE",
  "IN": "In",
  "ITER": "Iter",
  "KFLD": "KFld",
  "KLIST": "KList",
  "LEAVE": "Leave",
  "LEAVESR": "LeaveSr",
  "LOOKUP": "Lookup",
  "MONITOR": "Monitor",
  "MOVE": "Move",
  "MOVEL": "MoveL",
  "MULT": "Mult",
  "NEXT": "Next",
  "ON-ERROR": "On-Error",
  "ON-EXIT": "On-Exit",
  "OPEN": "Open",
  "OR": "Or",
  "OREQ": "OrEq",
  "ORGE": "OrGE",
  "ORGT": "OrGT",
  "ORLE": "OrLE",
  "ORLT": "OrLT",
  "ORNE": "OrNE",
  "OTHER": "Other",
  "OUT": "Out",
  "PARM": "Parm",
  "PLIST": "PList",
  "POST": "Post",
  "REALLOC": "Realloc",
  "READ": "Read",
  "READC": "ReadC",
  "READE": "ReadE",
  "READP": "ReadP",
  "READPE": "ReadPE",
  "REL": "Rel",
  "RESET": "Reset",
  "RETURN": "Return",
  "ROLBK": "RolBk",
  "SCAN": "Scan",
  "SELECT": "Select",
  "SETGT": "SetGT",
  "SETLL": "SetLL",
  "SETOFF": "SetOff",
  "SETON": "SetOn",
  "SHTDN": "ShtDn",
  "SORTA": "SortA",
  "SQRT": "SqRt",
  "SUB": "Sub",
  "SUBDUR": "SubDur",
  "SUBST": "Subst",
  "TIME": "Time",
  "UNLOCK": "Unlock",
  "UPDATE": "Update",
  "WHEN": "When",
  "WHENEQ": "WhenEq",
  "WHENGE": "WhenGE",
  "WHENGT": "WhenGT",
  "WHENLE": "WhenLE",
  "WHENLT": "WhenLT",
  "WHENNE": "WhenNE",
  "WRITE": "Write",
  "XFOOT": "XFoot",
  "XLATE": "XLate",
  "Z-ADD": "Z-Add",
  "Z-SUB": "Z-Sub",
  };

const EQUALITYOPERATORS = {
    "GT": `>`, "GE": `>=`,
    "LT": `<`, "LE": `<=`,
    "NE": `<>`, "EQ": `=`,
    "": ``
};

let LastCallExtender = ``;
let LastCallErrorInd = ``;
let LastCachedListName = {key: ``, output: ``};
let Lists = {};
let doingCALL = false;
let doingENTRY = false;
let idTempDoIdx = 0;
let idCaseGroup = 0;
let endList = [];
let convertedThisSpec = false;

module.exports = {
  init: function () {
    LastCallExtender = ``;
    LastCallErrorInd = ``;
    LastCachedListName = {key: ``, output: ``};
    Lists = {};
    doingCALL = false;
    doingENTRY = false;
    idTempDoIdx = 0;
    idCaseGroup = 0;
    endList = [];
    convertedThisSpec = false;
  },

  initOutput: function () {
    return {
      arrayoutput: [],
      beforeSpaces: 0,
      change: false,
      nextSpaces: 0,
      remove: false,
      value: ``

      , incrementReplacement: {name: null, value: null}
    };
  },

  /** Called once all line have been convertred to ensure any cached lines are flushed */
  final: function (input, indent, wasSub, wasLIKEDS) {
    let output = this.initOutput();
    if (true !== convertedThisSpec) {
      return output;
    }

    if (true === doingCALL) {
      output.arrayoutput.push((0 < LastCallExtender.length ? `${OPCODES[`CALLP`]}(${LastCallExtender}) ` : ``) + LastCachedListName.output + `(` + Lists[LastCachedListName.key].join(": ") + `);`);
      if (0 < LastCallErrorInd.length) {
        output.arrayoutput.push(`*in${LastCallErrorInd} = %Error()`);
      }
      doingCALL = false;
      LastCallExtender = ``;
      LastCallErrorInd = ``;
    }

    return output;
  },

  parse: function (input, indent, wasSub, wasLIKEDS) {
    let output = this.initOutput();
    let arrayoutput = [];
    const opCode = {
      output: ``,
      key: ``,
      extender: ``
    }

    let levelBreak = `L` === input.substr(7, 1).toUpperCase();
    let factor1 = input.substr(12, 14).trim();
    let factor2 = input.substr(36, 14).trim();
    let factor2Extended = input.substr(36).trim();
    let factor2ExtendedWithLeadingBlanks = input.substr(36).trimRight();
    let result = input.substr(50, 14).trim();
    let ind1 = input.substr(71, 2).trim();
    let ind2 = input.substr(73, 2).trim();
    let ind3 = input.substr(75, 2).trim();

    const condition = {
      not: input.substr(9, 1).toUpperCase() === `N`,
      ind: input.substr(10, 2).trim()
    };

    opCode.output = input.substr(26, 10).trim()
    opCode.key = opCode.output.toUpperCase();
    if (0 <= opCode.key.indexOf(`(`)) {
      opCode.extender = opCode.key.substring(opCode.key.indexOf(`(`) + 1, opCode.key.indexOf(`)`)).trim().replaceAll(` `, ``);
      opCode.key = opCode.key.substring(0, opCode.key.indexOf(`(`)).trim();
    }

    // If this is a known op-code, reformat the output op-code so that it has consistent
    //  casing and any extenders are upper-cased and separated by 1 space.
    if (OPCODES[opCode.key] !== undefined) {
      opCode.output = OPCODES[opCode.key] + (0 === opCode.extender.length ? `` : `(${opCode.extender})`);
    }

    convertedThisSpec = true;

    if (doingCALL && opCode.key !== `PARM`) {
      arrayoutput.push(buildSourceLine(0, true, (0 < LastCallExtender.length ? `${OPCODES[`CALLP`]}(${LastCallExtender}) ` : ``), `${LastCachedListName.output}(${Lists[LastCachedListName.key].join(": ")})`));
      if (0 < LastCallErrorInd.length) {
        arrayoutput.push(buildSourceLine(0, true, `*in${LastCallErrorInd}`, `= %Error()`));
      }
      doingCALL = false;
      LastCallExtender = ``;
      LastCallErrorInd = ``;
    }
    if (doingENTRY && opCode.key !== `PARM`) {
      doingENTRY = false;
    }

    let sqltest1 = input.substr(7, 9).trim().toUpperCase();
    let sqltest2 = input.substr(7, 1).trim().toUpperCase();
    let fixedSql = false;

    if (sqltest1 === `/EXEC SQL`) {
      output.value = ``.padEnd(7) + input.substr(8).trim();
      fixedSql = true;
      condition.ind = ``;
    } else if (sqltest1 === `/END-EXEC`) {
      output.value = ``.padEnd(7);
      condition.ind = ``;
    } else if (sqltest2 === `+`) {
      output.value = ``.padEnd(7) + input.substr(8).trim();
      fixedSql = true;
    } else if (true === levelBreak) {
      // Leave this statement alone
      output.ignore = true;
    } else {
      switch (opCode.key) {
        case `PLIST`:
        case `KLIST`:
          LastCachedListName = {key: factor1.toUpperCase(), output: factor1};
          Lists[LastCachedListName.key] = [];
          if (opCode.key === `PLIST` && factor1.toUpperCase() === `*ENTRY`) {
            doingENTRY = true;
          } else {
            output.remove = true;
          }
          break;

        case `PARM`:
        case `KFLD`:
          // Handle var declaration
          if (doingENTRY) {
            break;
          }
          Lists[LastCachedListName.key].push(result);
          output.remove = true;
          break;

        case `ACQ`:
          if (0 < ind2.length) {
            addOpCodeExtender(opCode, `E`);
          }
          arrayoutput.push(buildSourceLine(0, true, opCode.output, factor1, factor2));
          if (0 < ind2.length) {
            arrayoutput.push(buildSourceLine(0, true, `*in${ind2}`, `= %Error()`));
          }
          break;
  
        case `ADD`:
        case `DIV`:
        case `MULT`:
        case `SUB`:
        {
          const operator = {ADD: `+`, DIV: `/`, MULT: `+`, SUB: `-`}[opCode.key];
          const evalH = 0 < opCode.extender.length ? `${OPCODES[`EVAL`]}(${opCode.extender})` : ``;
          if (0 < factor1.length) {
            arrayoutput.push(buildSourceLine(0, true, evalH, result, `=`, factor1, operator, factor2));
          } else {
            arrayoutput.push(buildSourceLine(0, true, evalH, result, `${operator}=`, factor2));
          }
          addMathResultIndicators(arrayoutput, result, ind1, ind2, ind3);
          break;
        }
  
        case `ADDDUR`:
        {
          const wrapWithMonitor = 0 < ind2.length || 0 <= opCode.extender.indexOf(`E`);
          const periodBif = (0 <= factor2.indexOf(`:`) ? dateTimeDurrationToBif(factor2.split(`:`)[1].trim()) : ``);
          let nestedIndent = 0;

          if (true === wrapWithMonitor) {
            arrayoutput.push(buildSourceLine(nestedIndent, true, OPCODES[`MONITOR`]));
            nestedIndent += indent;
            addSetResultIndicators(arrayoutput, nestedIndent, false, ind2);
          }
          if (factor1) {
            arrayoutput.push(buildSourceLine(nestedIndent, true, result, `=`,  factor1, `+`, `${periodBif}(${factor2.split(":")[0].trim()})`));
          } else {
            arrayoutput.push(buildSourceLine(nestedIndent, true, result, `+=`, `${periodBif}(${factor2.split(":")[0].trim()})`));
          }
          if (true === wrapWithMonitor) {
            arrayoutput.push(buildSourceLine(nestedIndent - indent, true, OPCODES[`ON-ERROR`]));
            addSetResultIndicators(arrayoutput, nestedIndent, true, ind2);
            nestedIndent -= indent;
            arrayoutput.push(buildSourceLine(nestedIndent, true, OPCODES[`ENDMON`]));
          }
          break;
        }

        case `ALLOC`:
        {
          const wrapWithMonitor = 0 < ind2.length || 0 <= opCode.extender.indexOf(`E`);
          let nestedIndent = 0;

          if (true === wrapWithMonitor) {
            arrayoutput.push(buildSourceLine(nestedIndent, true, OPCODES[`MONITOR`]));
            nestedIndent += indent;
            addSetResultIndicators(arrayoutput, nestedIndent, false, ind2);
          }
          arrayoutput.push(buildSourceLine(nestedIndent, true, result, `=`, `%Alloc(${factor2}`));
          if (true === wrapWithMonitor) {
            arrayoutput.push(buildSourceLine(nestedIndent - indent, true, OPCODES[`ON-ERROR`]));
            addSetResultIndicators(arrayoutput, nestedIndent, true, ind2);
            nestedIndent -= indent;
            arrayoutput.push(buildSourceLine(nestedIndent, true, OPCODES[`ENDMON`]));
          }
          break;
        }

        case `ANDEQ`:
        case `ANDGE`:
        case `ANDGT`:
        case `ANDLE`:
        case `ANDLT`:
        case `ANDNE`:
          output.aboveKeywords = buildSourceLine(0, false, OPCODES[`AND`],
            factor1, EQUALITYOPERATORS[opCode.key.slice(-2)], factor2);
          break;

        case `BEGSR`:
          arrayoutput.push(buildSourceLine(0, true, opCode.output, factor1));
          output.nextSpaces = indent;
          break;

        case `CALL`:
        case `CALLB`:
        {
          // The "D" (parameter descriptor) op-code extender is not allowed on CALLP, so
          //  remove it.  On the other hand, if the ER result indicator was specified,
          //  add the E extender code.
          removeOpCodeExtender(opCode, `D`);
          if (0 < ind2.length) {
            addOpCodeExtender(opCode, `E`);
          }
          // Remove quotes from factor2
          if (0 === factor2.indexOf(`'`)) {
            factor2 = factor2.substring(1, factor2.length - 1);
          }
          if (0 < result.length) {
            let nestedIndent = 0;
            const wrapWithMonitor = 0 < opCode.extender.length;
            if (true === wrapWithMonitor) {
              arrayoutput.push(buildSourceLine(nestedIndent, true, OPCODES[`MONITOR`]));
              nestedIndent += indent;
              addSetResultIndicators(arrayoutput, nestedIndent, false, ind2);
            }

            // If the parameter list is known, output the call exploding the PLIST fields into
            // a parameter list.  If we have not seen the PLIST, output a line that will cause
            // a compilation failure, but at least give a clue as to why it failed.
            if (Lists[result.toUpperCase()]) {
              if (0 < opCode.extender.length) {
                // CALL and CALLB must be remapped to CALLP in free form
                arrayoutput.push(buildSourceLine(nestedIndent, true, `${OPCODES[`CALLP`]}(${opCode.extender})`, `${factor2}(${Lists[result.toUpperCase()].join(":")})`));
              } else {
                arrayoutput.push(buildSourceLine(nestedIndent, true, `${factor2}(${Lists[result.toUpperCase()].join(":")})`));
              }
            } else {
              if (0 < opCode.extender.length) {
                arrayoutput.push(buildSourceLine(nestedIndent, true, `${OPCODES[`CALLP`]}(${opCode.extender})`, `${factor2}(<Unknown PLIST ${result.toUpperCase().trim()}>)`));
              } else {
                arrayoutput.push(buildSourceLine(nestedIndent, true, `${factor2}(<Unknown PLIST ${result.toUpperCase()}>)`));
              }
            }
            if (true === wrapWithMonitor) {
              arrayoutput.push(buildSourceLine(nestedIndent - indent, true, OPCODES[`ON-ERROR`]));
              addSetResultIndicators(arrayoutput, nestedIndent, true, ind2);
              nestedIndent -= indent;
              arrayoutput.push(buildSourceLine(nestedIndent, true, OPCODES[`ENDMON`]));
            }
          } else {
            // Mark this line for removal only if we have not already added something
            //  to the output.
            output.remove = 0 === arrayoutput.length && 0 === output.value.length;
            LastCachedListName = {key: factor2.toUpperCase(), output: factor2};
            Lists[LastCachedListName.key] = [];
            doingCALL = true;
            LastCallExtender = opCode.extender;
            LastCallErrorInd = ind2;
          }
          break;
        }

        case `CALLP`:
          if (0 < ind2.length) {
            addOpCodeExtender(opCode, `E`);
          }
          if (0 < opCode.extender.length) {
            arrayoutput.push(buildSourceLine(0, true, opCode.output, factor2Extended));
          } else {
            arrayoutput.push(buildSourceLine(0, true, factor2Extended));
          }
          if (0 < ind2.length) {
            arrayoutput.push(buildSourceLine(0, true, `*in${ind2}`, `= %Error()`));
          }
          break;

        case `CAS`:
        case `CASEQ`:
        case `CASGE`:
        case `CASGT`:
        case `CASLE`:
        case `CASLT`:
        case `CASNE`:
        {
          const endStatement = `${OPCODES[`ENDDO`]};  // End case group`;
          let nestedIndent = 0;

          // If this is a CAS (not CASxx), the comparison operation
          //  is determiend by the specified result indicators.
          //  Of course, we can only make a comparison if we have _both_
          //  a factor1 and factor2.
          let operatorKey = (opCode.key.padEnd(5)).slice(-2).trim();
          if (0 === operatorKey.length && 0 < factor1.length && 0 < factor2.length) {
            if (0 < ind1.length) {
              if (0 < ind2.length) {
                if (0 < ind3.length) {
                  operatorKey = ``;
                } else {
                  operatorKey = `NE`;
                }
              } else if (0 < ind3.length) {
                operatorKey = `GE`;
              }
            } else if (0 < ind2.length) {
              if (0 < ind3.length) {
                operatorKey = `LE`;
              } else {
                operatorKey = `LT`;
              }
            } else if (0 < ind3.length) {
              operatorKey = `EQ`;
            }
          }

          const turnOnIndicators = (0 < operatorKey.length && 0 < factor1.length && 0 < factor2.length);

          // Assign an id to this case group which will be used when we hit the ENDCS
          //  to close the loop we used to wrap the converted CAS/CASxx statements.
          if (endList.length < 1 || !endList[endList.length - 1].startsWith(endStatement)) {
            nestedIndent = indent;
            output.nextSpaces = indent;
            idCaseGroup += 1;
            arrayoutput.push(`${OPCODES[`DOU`]} 1 = 1;  // Begin case group ${idCaseGroup}`);
            endList.push(endStatement + ` ${idCaseGroup}`);
          }

          if (0 < condition.ind.length) {
            arrayoutput.push(buildSourceLine(nestedIndent, true, OPCODES[`IF`], (condition.not ? `not` : ``), `*in${condition.ind}`));
            nestedIndent += indent;
          }
          addSetResultIndicators(arrayoutput, nestedIndent, false, ind1, ind2, ind3)
          if (0 < operatorKey.length) {
            arrayoutput.push(buildSourceLine(nestedIndent, true,
                OPCODES[`IF`], factor1, EQUALITYOPERATORS[operatorKey], factor2));
            nestedIndent += indent;
            if (true === turnOnIndicators) {
              addCompResultIndicators(arrayoutput, nestedIndent, factor1, factor2, ind1, ind2, ind3, true);
            }
            arrayoutput.push(buildSourceLine(nestedIndent, true, OPCODES[`EXSR`], result));
            arrayoutput.push(buildSourceLine(nestedIndent, true, OPCODES[`LEAVE`]));
            nestedIndent -= indent;
            arrayoutput.push(buildSourceLine(nestedIndent, true, OPCODES[`ENDIF`]));
          } else {
            if (true === turnOnIndicators) {
              addCompResultIndicators(arrayoutput, nestedIndent, factor1, factor2, ind1, ind2, ind3, true);
            }
            arrayoutput.push(buildSourceLine(nestedIndent, true, OPCODES[`EXSR`], result));
            arrayoutput.push(buildSourceLine(nestedIndent, true, OPCODES[`LEAVE`]));
          }
          if (0 < condition.ind.length) {
            nestedIndent -= indent;
            arrayoutput.push(buildSourceLine(0, true, OPCODES[`ENDIF`]));
            condition.ind = ``;
          }
          break;
        }

        case `CAT`:
          output.ignore = true;
          break;

        case `CHAIN`:
          if (0 < ind2.length) {
            addOpCodeExtender(`E`);
          }
          if (Lists[factor1.toUpperCase()]) {
            arrayoutput.push(buildSourceLine(0, true, opCode.output,
              `(` + Lists[factor1.toUpperCase()].join(": ") + `)`, factor2, result));
          } else {
            arrayoutput.push(buildSourceLine(0, true, opCode.output, factor1, factor2, result));
          }
          if (0 < ind1.length) {
            if (ind1 !== ind2) {
              arrayoutput.push(buildSourceLine(0, true, `*in${ind1}`, `= not %Found()`));
            } else {
              arrayoutput.push(buildSourceLine(0, true, `*in${ind1}`, `= not %Found() or %Error()`));
            }
          }
          if (0 < ind2.length) {
            if (ind2 !== ind1) {
              arrayoutput.push(buildSourceLine(0, true, `*in${ind2}`, `= %Error()`));
            }
          }
          break;

        case `CHECK`:
        case `CHECKR`:
        {
          const checkBif = (opCode.key === `CHECK` ? `%Check` : `%CheckR`);
          const wrapWithMonitor = 0 < opCode.extender.length || 0 < ind2.length;
          let nestedIndent = 0;

          if (true === wrapWithMonitor) {
            arrayoutput.push(buildSourceLine(nestedIndent, true, OPCODES[`MONITOR`]));
            nestedIndent += indent;
            addSetResultIndicators(arrayoutput, nestedIndent, false, ind2, ind3);
          } 
          if (0 <= factor2.indexOf(`:`)) {
            let startPos = ``;
            [factor2, startPos] = factor2.split(`:`);
            factor2 = factor2.trim();
            startPos = startPos.trim();
            arrayoutput.push(buildSourceLine(nestedIndent, true, result, `=`, `${checkBif}(${factor1}: ${factor2}: ${startPos})`));
          } else {
            arrayoutput.push(buildSourceLine(nestedIndent, true, result, `=`, `${checkBif}(${factor1}: ${factor2})`));
          }
          arrayoutput.push(buildSourceLine(nestedIndent, true, `*in${ind3}`, `= %Found();`));
          if (true === wrapWithMonitor) {
            arrayoutput.push(buildSourceLine(nestedIndent - indent, true, OPCODES[`ON-ERROR`]));
            addSetResultIndicators(arrayoutput, nestedIndent, true, ind2);
            nestedIndent -= indent;
            arrayoutput.push(buildSourceLine(nestedIndent, true, OPCODES[`ENDMON`]));
          } 
          break;
        }

        case `CLEAR`:
          arrayoutput.push(buildSourceLine(0, false, opCode.output, factor1, factor2, result));
          break;

        case `CLOSE`:
          if (0 < ind2.length) {
            addOpCodeExtender(opCode, `E`);
          }
          arrayoutput.push(buildSourceLine(0, true, opCode.output, factor2));
          if (0 < ind2.length) {
            arrayoutput.push(buildSourceLine(0, true, `*in${ind2}`, `= %Error()`));
          }
          break;

        case `COMMIT`:
          if (0 < ind2.length) {
            addOpCodeExtender(opCode, `E`);
          }
          arrayoutput.push(buildSourceLine(0, true, opCode.output, factor1));
          if (0 < ind2.length) {
            arrayoutput.push(buildSourceLine(0, true, `*in${ind2}`, `= %Error()`));
          }
          break;
  
        case `COMP`:
          addSetResultIndicators(arrayoutput, 0, false, ind1, ind2, ind3);
          addCompResultIndicators(arrayoutput, 0, factor1, factor2, ind1, ind2, ind3);
          break;

        case `DEALLOC`:
          if (0 < ind2.length) {
            addOpCodeExtender(opCode, `E`);
          }
          arrayoutput.push(buildSourceLine(0, true, opCode.output, factor2));
          if (0 < ind2.length) {
            arrayoutput.push(buildSourceLine(0, true, `*in${ind2}`, `= %Error()`));
          }
          break;

        case `DELETE`:
          if (0 < ind2.length) {
            addOpCodeExtender(opCode, `E`);
          }
          if (Lists[factor1.toUpperCase()]) {
            arrayoutput.push(buildSourceLine(0, true, opCode.output, `(${Lists[factor1.toUpperCase()].join(": ")})`, factor2));
          } else {
            arrayoutput.push(buildSourceLine(0, true, opCode.output, factor1, factor2));
          }
          if (0 < ind1.length) {
            if (ind1 !== ind2) {
              arrayoutput.push(buildSourceLine(0, true, `*in${ind1}`, `= not %Found()`));
            } else {
              arrayoutput.push(buildSourceLine(0, true, `*in${ind1}`, `= not %Found() or %Error()`));
            }
          }
          if (0 < ind2.length) {
            if (ind2 !== ind1) {
              arrayoutput.push(buildSourceLine(0, true, `*in${ind2}`, `= %Error()`));
            }
          }
          break;

        case `DO`:
          let nestedIndent = 0;
          let endOp = ``;

          if (0 < condition.ind.length) {
            arrayoutput.push(buildSourceLine(nestedIndent, true, OPCODES[`IF`], (condition.not ? `not` : ``), `*in${condition.ind}`));
            nestedIndent += indent;
          }
          // If no start, limit, nor index specified, this is a do-once loop.
          if (0 === result.length && 0 === factor1.length && 0 === factor2.length) {
            arrayoutput.push(buildSourceLine(nestedIndent, true, OPCODES[`DOU`], `1 = 1`));
            endOp = OPCODES[`ENDDO`];
          } else {
            // If any of start, limit, or index is specified, then we need
            // to map this to a For loop.  The problem is that the
            // FOR/ENDFOR loop requires us to specify either that we are
            // incrementing or decrementing our loop (based on the "TO/DOWNTO" keyword).
            // As the increment on the traditional DO/ENDDO can be a variable,
            // we have no idea if we should be using the TO or DOWNTO keyword here.
            // For now, use TO.  When we find the matching ENDDO, if it is a literal
            // negative value, we can change the TO to DOWNTO.
            arrayoutput.push(buildSourceLine(nestedIndent, true, OPCODES[`FOR`], result === "" ? getNameForTempDoIdx() : result, `=`,
              factor1 === "" ? `1` : factor1, `by`, `<increment-${endList.length + 1}>`, `to`, factor2 === "" ? 1 : factor2));
            endOp = OPCODES[`ENDFOR`];
          }
          if (0 < condition.ind.length) {
            endOp = " ".repeat(nestedIndent) + endOp + `;\n       ${OPCODES[`ENDIF`]}`;
            condition.ind = ``;
          }
          output.nextSpaces = indent;
          endList.push(endOp);
          break;

        case `DOU`:
        case `DOW`:
          arrayoutput.push(buildSourceLine(nestedIndent, true, opCode.output, factor2Extended));
          output.nextSpaces = indent;
          endList.push(OPCODES[`ENDDO`]);
          break;

        case `DOUEQ`:
        case `DOUGE`:
        case `DOUGT`:
        case `DOULE`:
        case `DOULT`:
        case `DOUNE`:
        {
          const operator = EQUALITYOPERATORS[opCode.key.slice(-2)];
          arrayoutput.push(buildSourceLine(nestedIndent, true, `${OPCODES[`DOU`]}(${opCode.extender})`, factor1, operator, factor2));
          output.nextSpaces = indent;
          endList.push(OPCODES[`ENDDO`]);
          break;
        }

        case `DOWEQ`:
        case `DOWGT`:
        case `DOWGE`:
        case `DOWLE`:
        case `DOWLT`:
        case `DOWNE`:
        {
          const operator = EQUALITYOPERATORS[opCode.key.slice(-2)];
          arrayoutput.push(buildSourceLine(nestedIndent, true, `${OPCODES[`DOW`]}(${opCode.extender})`, factor1, operator, factor2));
          output.nextSpaces = indent;
          endList.push(OPCODES[`ENDDO`]);
          break;
        }

        case `DSPLY`:
          if (0 < ind2.length) {
            addOpCodeExtender(opCode, `E`);
          }
          arrayoutput.push(buildSourceLine(0, true, opCode.output, factor1, factor2, result));
          if (0 < ind2.length) {
            arrayoutput.push(buildSourceLine(0, true, `*in${ind2}`, `= %Error()`));
          }
          break;

        case `DUMP`:
        {
          const wrapWithMonitor = 0 < ind2.length;
          let nestedIndent = 0;

          if (true === wrapWithMonitor) {
            arrayoutput.push(buildSourceLine(nestedIndent, true, OPCODES[`MONITOR`]));
            nestedIndent += indent;
            addSetResultIndicators(arrayoutput, nestedIndent, false, ind2);
          }
          arrayoutput.push(buildSourceLine(nestedIndent, true, opCode.output, factor1));
          if (true === wrapWithMonitor) {
            arrayoutput.push(buildSourceLine(nestedIndent - indent, true, OPCODES[`ON-ERROR`]));
            addSetResultIndicators(arrayoutput, nestedIndent, true, ind2);
            nestedIndent -= indent;
            arrayoutput.push(buildSourceLine(nestedIndent, true, OPCODES[`ENDMON`]));
          }
          break;
        }

        case `ELSE`:
        case `ELSEIF`:
          output.beforeSpaces = -indent;
          output.nextSpaces = indent;
          indentOutputLines(arrayoutput, indent);
          arrayoutput.push(buildSourceLine(0, true, opCode.output, factor2Extended));
          break;

        case `END`:
        case `ENDDO`:
        {
          let endSourceLine = ``;
          output.incrementReplacement.name = `<increment-${endList.length}>`;
          output.incrementReplacement.value = factor2;
          output.beforeSpaces = -indent;
          indentOutputLines(arrayoutput, indent);
          if (0 < endList.length) {
            endSourceLine = endList.pop();
          } else {
            endSourceLine = opCode.output;
            output.message = `Unmatched ${opCode.key}, actual op-code "${opCode.output}".`;
          }
          if (`;` !== endSourceLine.slice(-1)) {
            if (0 > endSourceLine.indexOf(`//`)) {
              endSourceLine += ';'
            }
          }
          arrayoutput.push(buildSourceLine(0, false, endSourceLine));
          break;
        }

        case `ENDCS`:
        case `ENDFOR`:
        case `ENDIF`:
        case `ENDSL`:
        {
          let endSourceLine = ``;
          output.beforeSpaces = -indent;
          indentOutputLines(arrayoutput, indent);
          if (0 < endList.length) {
            endSourceLine = endList.pop();
          } else {
            endSourceLine = opCode.output;
            output.message = `Unmatched ${opCode.key}, actual op-code "${opCode.output}".`;
          }
          if (`;` !== endSourceLine.slice(-1)) {
            if (0 > endSourceLine.indexOf(`//`)) {
              endSourceLine += ';'
            }
          }
          arrayoutput.push(buildSourceLine(0, false, endSourceLine));
          break;
        }

        case `ENDMON`:
        case `ENDSR`:
          output.beforeSpaces = -indent;
          indentOutputLines(arrayoutput, indent);
          arrayoutput.push(buildSourceLine(0, true, opCode.output, factor2));
          break;

        case `EVAL`:
        case `EVALR`:
        {
          const outputOpCode = (opCode.key === `EVALR` || 0 < opCode.extender.length ? opCode.output : ``);
          output.value = buildSourceLine(0, false, outputOpCode, factor2Extended);
          // If the extended section ends with a continuation
          //  character (+/-), then this _may_ be a continued
          //  literal or some type of formula.  If this is *not* a
          //  continued literal, add a trailing blank to prevent 
          //  the last character on the line from being a continuation
          //  character.
          if (factor2Extended.endsWith(`+`) || factor2Extended.endsWith(`-`)) {
            let nbrQuotes = (factor2Extended.match(/'/g) || []).length;
            if (1 !== (1 & nbrQuotes)) {
              output.value += ` `;
            }
          }
          break;
        }

        case `EVAL-CORR`:
          arrayoutput.push(buildSourceLine(0, true, opCode.output, factor2Extended));
          break;

        case `EXCEPT`:
          arrayoutput.push(buildSourceLine(0, true, opCode.output, factor2));
          break;

        case `EXFMT`:
          if (0 < ind2.length) {
            addOpCodeExtender(opCode, `E`);
          }
          arrayoutput.push(buildSourceLine(0, true, opCode.output, factor2, result));
          if (0 < ind2.length) {
            arrayoutput.push(buildSourceLine(0, true, `*in${ind2}`, `= %Error()`));
          }
          break;

        case `EXSR`:
          arrayoutput.push(buildSourceLine(0, true, opCode.output, factor2));
          break;

        case `FEOD`:
          if (0 < ind2.length) {
            addOpCodeExtender(opCode, `E`);
          }
          arrayoutput.push(buildSourceLine(0, true, opCode.output, factor2));
          if (0 < ind2.length) {
            arrayoutput.push(buildSourceLine(0, true, `*in${ind2}`, `= %Error()`));
          }
          break;

        case `FOR`:
          arrayoutput.push(buildSourceLine(0, true, opCode.output, factor2Extended));
          output.nextSpaces = indent;
          endList.push(OPCODES[`ENDFOR`]);
          break;

        case `FORCE`:
          arrayoutput.push(buildSourceLine(0, true, opCode.output, factor2));
          break;

        case `IF`:
          arrayoutput.push(buildSourceLine(0, true, opCode.output, factor2Extended));
          output.nextSpaces = indent;
          endList.push(OPCODES[`ENDIF`]);
          break;

        case `IFEQ`:
        case `IFGE`:
        case `IFGT`:
        case `IFLE`:
        case `IFLT`:
        case `IFNE`:
          arrayoutput.push(buildSourceLine(0, true, OPCODES[`IF`],
            factor1, EQUALITYOPERATORS[opCode.key.slice(-2)], factor2));
          output.nextSpaces = indent;
          endList.push(OPCODES[`ENDIF`]);
          break;

        case `IN`:
          if (0 < ind2.length) {
            addOpCodeExtender(opCode, `E`);
          }
          arrayoutput.push(buildSourceLine(0, true, opCode.output, factor1, factor2));
          if (0 < ind2.length) {
            arrayoutput.push(buildSourceLine(0, true, `*in${ind2}`, `= %Error()`));
          }
          break;

        case `ITER`:
          arrayoutput.push(buildSourceLine(0, true, opCode.output));
          break;

        case `LEAVE`:
        case `LEAVESR`:
          arrayoutput.push(buildSourceLine(0, true, opCode.output));
          break;

        case `LOOKUP`:
        {
          let lookupOperation = `%Lookup`;
          let altTab = ``;
          if (/^TAB/i.test(factor2)) {
            lookupOperation = `%Tlookup`;
            if (0 < result.length) {
              altTab = `: ${result}`;
            }
          }
          if (0 < ind1.length) {
            if (0 < ind3.length) {
              lookupOperation += `ge`;
            } else {
              lookupOperation += `gt`;
            }
          } else if (0 < ind2.length) {
            if (0 < ind3.length) {
              lookupOperation += `le`;
            } else {
              lookupOperation += `lt`;
            }
          }
          // if factor2 has a paren then need to split that value out
          if (0 <= factor2.indexOf(`(`)) {
            let array = factor2.substr(0, factor2.indexOf(`(`));
            let index = factor2.substring(factor2.indexOf(`(`) + 1, factor2.indexOf(`)`)).trim();
            arrayoutput.push(buildSourceLine(0, true, `${lookupOperation}(${factor1}: ${array}: ${index}`.trimEnd() + `${altTab})`));
          } else {
            arrayoutput.push(buildSourceLine(0, true, `${lookupOperation}(${factor1}: ${factor2}`.trimEnd() + `${altTab})`));
          }
          if (0 < ind1.length) {
            if (ind1 !== ind3) {
              arrayoutput.push(buildSourceLine(0, true, `*in${ind1}`, `= %Found()`));
            } else {
              arrayoutput.push(buildSourceLine(0, true, `*in${ind1}`, `= %Found() or %Equal()`));
            }
          }
          if (0 < ind2.length) {
            if (ind2 !== ind3) {
              arrayoutput.push(buildSourceLine(0, true, `*in${ind2}`, `= %Found()`));
            } else {
              arrayoutput.push(buildSourceLine(0, true, `*in${ind2}`, `= %Found() or %Equal()`));
            }
          }
          if (0 < ind3.length) {
            if (ind3 !== ind1 && ind3 !== ind2) {
              arrayoutput.push(buildSourceLine(0, true, `*in${ind3}`, `= %Equal()`));
            }
          }
          break;
        }

        case `MONITOR`:
          arrayoutput.push(buildSourceLine(0, true, opCode.output));
          output.nextSpaces = indent;
          break;

        case `MOVE`:
        case `MOVEL`:
          //output.move = {
          //  target: result,
          //  source: factor2,
          //  attr: factor1,
          //  dir: plainOp,
          //  padded: (0 <= extender.indexOf(`P`))
          //}
          output.ignore = true;
          break;

        case `NEXT`:
          if (0 < ind2.length) {
            addOpCodeExtender(opCode, `E`);
          }
          arrayoutput.push(buildSourceLine(0, true, opCode.output, factor1, factor2));
          if (0 < ind2.length) {
            arrayoutput.push(buildSourceLine(0, true, `*in${ind2}`, `= %Error()`));
          }
          break;

        case `ON-ERROR`:
        case `ON-EXIT`:
          output.beforeSpaces = -indent;
          arrayoutput.push(buildSourceLine(0, true, opCode.output, factor2Extended));
          output.nextSpaces = indent;
          break;

        case `OPEN`:
          if (0 < ind2.length) {
            addOpCodeExtender(opCode, `E`);
          }
          arrayoutput.push(buildSourceLine(0, true, opCode.output, factor2));
          if (0 < ind2.length) {
            arrayoutput.push(buildSourceLine(0, true, `*in${ind2}`, `= %Error()`));
          }
          break;

        case `OREQ`:
        case `ORGE`:
        case `ORGT`:
        case `ORLE`:
        case `ORLT`:
        case `ORNE`:
          output.aboveKeywords = buildSourceLine(0, false, OPCODES[`OR`],
            factor1, EQUALITYOPERATORS[opCode.key.slice(-2)], factor2);
          break;

        case `OTHER`:
          output.beforeSpaces = -indent;
          arrayoutput.push(buildSourceLine(0, true, opCode.output));
          output.nextSpaces = indent;
          break;

        case `OUT`:
          if (0 < ind2.length) {
            addOpCodeExtender(opCode, `E`);
          }
          arrayoutput.push(buildSourceLine(0, true, opCode.output, factor1, factor2));
          if (0 < ind2.length) {
            arrayoutput.push(buildSourceLine(0, true, `*in${ind2}`, `= %Error()`));
          }
          break;

        case `POST`:
          if (0 < ind2.length) {
            addOpCodeExtender(opCode, `E`);
          }
          arrayoutput.push(buildSourceLine(0, true, opCode.output, factor1, factor2, result));
          if (0 < ind2.length) {
            arrayoutput.push(buildSourceLine(0, true, `*in${ind2}`, `= %Error()`));
          }
          break;
  
        case `READ`:
        case `READC`:
        case `READP`:
          if (0 < ind2.length) {
            addOpCodeExtender(opCode, `E`);
          }
          arrayoutput.push(buildSourceLine(0, true, opCode.output, factor2, result));
          if (0 < ind2.length) {
            if (ind2 !== ind3) {
              arrayoutput.push(buildSourceLine(0, true, `*in${ind2}`, `= %Error()`));
            } else {
              arrayoutput.push(buildSourceLine(0, true, `*in${ind2}`, `= %Error() or %Eof()`));
            }
          }
          if (0 < ind3.length) {
            if (ind3 !== ind2) {
              arrayoutput.push(buildSourceLine(0, true, `*in${ind3}`, `= %Eof()`));
            }
          }
          break;
  
        case `READE`:
        case `READPE`:
          if (0 < ind2.length) {
            addOpCodeExtender(opCode, `E`);
          }
          if (Lists[factor1.toUpperCase()]) {
            arrayoutput.push(buildSourceLine(0, true, opCode.output,
              `(${Lists[factor1.toUpperCase()].join(": ")})`, factor2, result));
          } else {
            arrayoutput.push(buildSourceLine(0, true, opCode.output,
              factor1, factor2, result));
          }
          if (0 < ind2.length) {
            if (ind2 !== ind3) {
              arrayoutput.push(buildSourceLine(0, true, `*in${ind2}`, `= %Error()`));
            } else {
              arrayoutput.push(buildSourceLine(0, true, `*in${ind2}`, `= %Error() or %Eof()`));
            }
          }
          if (0 < ind3.length) {
            if (ind3 !== ind2) {
              arrayoutput.push(buildSourceLine(0, true, `*in${ind3}`, `= %Eof()`));
            }
          }
          break;

        case `REALLOC`:
        {
          const wrapWithMonitor = 0 < ind2.length || 0 <= opCode.extender.indexOf(`E`);
          let nestedIndent = 0;

          if (true === wrapWithMonitor) {
            arrayoutput.push(buildSourceLine(nestedIndent, true, OPCODES[`MONITOR`]));
            nestedIndent += indent;
            addSetResultIndicators(arrayoutput, nestedIndent, false, ind2);
          }
          arrayoutput.push(buildSourceLine(nestedIndent, true, result, `=`
            , `%Realloc(${result}: ${factor1}`));
          if (true === wrapWithMonitor) {
            arrayoutput.push(buildSourceLine(nestedIndent - indent, true, OPCODES[`ON-ERROR`]));
            addSetResultIndicators(arrayoutput, nestedIndent, true, ind2);
            nestedIndent -= indent;
            arrayoutput.push(buildSourceLine(nestedIndent, true, OPCODES[`ENDMON`]));
          }
          break;
        }
    
        case `REL`:
          if (0 < ind2.length) {
            addOpCodeExtender(opCode, `E`);
          }
          arrayoutput.push(buildSourceLine(0, true, opCode.output, factor1, factor2));
          if (0 < ind2.length) {
            arrayoutput.push(buildSourceLine(0, true, `*in${ind2}`, `= %Error()`));
          }
          break;

        case `RESET`:
          if (0 < ind2.length) {
            addOpCodeExtender(opCode, `E`);
          }
          arrayoutput.push(buildSourceLine(0, true, opCode.output, factor1, factor2, result));
          if (0 < ind2.length) {
            arrayoutput.push(buildSourceLine(0, true, `*in${ind2}`, `= %Error()`));
          }
          break;

        case `RETURN`:
          arrayoutput.push(buildSourceLine(0, true, opCode.output, factor2Extended));
          break;

        case `ROLBK`:
          if (0 < ind2.length) {
            addOpCodeExtender(opCode, `E`);
          }
          arrayoutput.push(buildSourceLine(0, true, opCode.output));
          if (0 < ind2.length) {
            arrayoutput.push(buildSourceLine(0, true, `*in${ind2}`, `= %Error()`));
          }
          break;

        case `SCAN`:
        {
          const wrapWithMonitor = 0 < opCode.extender.length || 0 < ind2.length;
          let nestedIndent = 0;
          let searchArg = factor1;
          let length = ``;
          let sourceString = factor2;
          let startPos = ``;
          let optionalStartLength = ``;

          if (0 <= factor1.indexOf(`:`)) {
            [searchArg, length] = factor1.split(`:`);
            searchArg = searchArg.trim();
            length = length.trim();
          }
          if (0 <= factor2.indexOf(`:`)) {
            [sourceString, startPos] = factor1.split(`:`);
            sourceString = sourceString.trim();
            startPos = startPos.trim();
          }
          if (0 < length.length || 0 < startPos.length) {
            optionalStartLength = `: ${startPos !== "" ? startPos : "1"}`;
            if (0 < length.length) {
              optionalStartLength += `: ${length}`;
            }
          }

          if (true === wrapWithMonitor) {
            arrayoutput.push(buildSourceLine(nestedIndent, true, OPCODES[`MONITOR`]));
            nestedIndent += indent;
            addSetResultIndicators(arrayoutput, nestedIndent, false, ind2, ind3);
          }
          arrayoutput.push(buildSourceLine(nestedIndent, true, result, `=`
            ,`%Scan(${factor1}: ${factor2}${optionalStartLength})`));
          if (0 < ind3.length) {
            arrayoutput.push(buildSourceLine(nestedIndent, true, `*in${ind3}`, `=`, `%Found()`));
          }
          if (true === wrapWithMonitor) {
            arrayoutput.push(buildSourceLine(nestedIndent - indent, true, OPCODES[`ON-ERROR`]));
            addSetResultIndicators(arrayoutput, nestedIndent, false, ind2);
            nestedIndent += indent;
            arrayoutput.push(buildSourceLine(nestedIndent, true, OPCODES[`ENDMON`]));
          }
          break;
        }
         
        case `SELECT`:
          arrayoutput.push(buildSourceLine(0, true, opCode.output));
          output.nextSpaces = indent * 2;
          endList.push(OPCODES[`ENDSL`]);
          break;

        case `SETGT`:
        case `SETLL`:
        {
          if (0 < ind2.length) {
            addOpCodeExtender(opCode, `E`);
          }
          if (Lists[factor1.toUpperCase()]) {
            arrayoutput.push(buildSourceLine(0, true, opCode.output, `(${Lists[factor1.toUpperCase()].join(": ")})`, factor2));
          } else {
            arrayoutput.push(buildSourceLine(0, true, opCode.output, factor1, factor2));
          }
          if (0 < ind1.length) {
            let indResults = `*in${ind1} = (not %Found())`;
            if (ind1 === ind2) {
              indResults += ` or %Error()`;
            }
            if (ind1 === ind3) {
              indResults += ` or %Equal()`;
            }
            arrayoutput.push(buildSourceLine(0, true, indResults));
          }
          if (0 < ind2.length) {
            let indResults = `*in${ind2} = %Error()`;
            if (ind2 === ind3) {
              indResults += ` or %Equal()`;
            }
            arrayoutput.push(buildSourceLine(0, true, indResults));
          }
          if (0 < ind3.length) {
            if (ind3 !== ind1 && ind3 !== ind2) {
              arrayoutput.push(buildSourceLine(0, true, `*in${ind3}`, `= %Equal()`));
            }
          }
          break;
        }

        case `SETOFF`:
          addSetResultIndicators(arrayoutput, 0, false, ind1, ind2, ind3);
          break;

        case `SETON`:
          addSetResultIndicators(arrayoutput, 0, true, ind1, ind2, ind3);
          break;

        case `SHTDN`:
          arrayoutput.push(buildSourceLine(0, true, `*in${ind1}`, `= %Shut()`));
          break;
  
        case `SORTA`:
          arrayoutput.push(buildSourceLine(0, true, opCode.output, factor2Extended));
          break;

        case `SQRT`:
        {
          const evalH = 0 < opCode.extender.length ? `${OPCODES[`EVAL`]}(${opCode.extender})` : ``;
          arrayoutput.push(buildSourceLine(0, true, evalH, result, `=`, `%Sqrt(${factor2})`));
          break;
        }

        case `SUBDUR`:
        {
          const wrapWithMonitor = 0 < ind2.length || 0 <= opCode.extender.indexOf(`E`);
          const periodBif = (0 <= factor2.indexOf(`:`) ? dateTimeDurrationToBif(factor2.split(`:`)[1].trim()) : ``);
          let nestedIndent = 0;

          if (true === wrapWithMonitor) {
            arrayoutput.push(buildSourceLine(nestedIndent, true, OPCODES[`MONITOR`]));
            nestedIndent += indent;
            addSetResultIndicators(arrayoutput, nestedIndent, false, ind2);
          }

          // If factor2 has a : then it is a duration and we are subtacting a
          //  duriation from a date or time.  Otherwise, we are calculating the 
          //  difference between two date/time values.
          if (0 < periodBif.length) {
            if (factor1) {
              arrayoutput.push(buildSourceLine(nestedIndent, true, result, `=`, factor1, `-`, `${periodBif}(${factor2.split(":")[0]})`));
            } else {
              arrayoutput.push(buildSourceLine(nestedIndent, true, result, `-=`, `${periodBif}(${factor2.split(":")[0]})`));
            }
          } else {
            arrayoutput.push(buildSourceLine(nestedIndent, true, result.split(":")[0], `=`, `%Diff(${factor1}: ${factor2}: ${result.split(":")[1]})`));
          }

          if (true === wrapWithMonitor) {
            arrayoutput.push(buildSourceLine(nestedIndent - indent, true, OPCODES[`ON-ERROR`]));
            addSetResultIndicators(arrayoutput, nestedIndent, true, ind2);
            nestedIndent -= indent;
            arrayoutput.push(buildSourceLine(nestedIndent, true, OPCODES[`ENDMON`]));
          }
          break;
        }

        case `SUBST`:
        {
          if (0 > opCode.extender.indexOf(`P`)) {
            output.ignore;
          } else {
            const wrapWithMonitor = 0 < ind2.length || 0 <= opCode.extender.indexOf(`E`);
            let nestedIndent = 0;
            let startPos = `1`;

            // Capture the starting position, if one was given
            if (0 <= factor2.indexOf(`:`)) {
              [factor2, startPos] = factor2.split(`:`);
              factor2 = factor2.trim();
              startPos = startPos.trim();
            }

            if (true === wrapWithMonitor) {
              arrayoutput.push(buildSourceLine(nestedIndent, true, OPCODES[`MONITOR`]));
              nestedIndent += indent;
              addSetResultIndicators(arrayoutput, nestedIndent, false, ind2);
            }
            if (0 == factor1.trim().length) {
              arrayoutput.push(buildSourceLine(nestedIndent, true, result, `=`, `%Subst(${factor2}: ${startPos})`));
            } else {
              arrayoutput.push(buildSourceLine(nestedIndent, true, result, `=`, `%Subst(${factor2}: ${startPos}: ${factor1})`));
            }
            if (true === wrapWithMonitor) {
              arrayoutput.push(buildSourceLine(nestedIndent - indent, true, OPCODES[`ON-ERROR`]));
              addSetResultIndicators(arrayoutput, nestedIndent, true, ind2);
              nestedIndent -= indent;
              arrayoutput.push(buildSourceLine(nestedIndent, true, OPCODES[`ENDMON`]));
            }
          }
          break;
        }

        case `TIME`:
          arrayoutput.push(buildSourceLine(0, true, result, `= %Time()`));
          break;

        case `UNLOCK`:
          if (0 < ind2.length) {
            addOpCodeExtender(opCode, `E`);
          }
          arrayoutput.push(buildSourceLine(0, true, opCode.output, factor2));
          if (0 < ind2.length) {
            arrayoutput.push(buildSourceLine(0, true, `*in${ind2}`, `= %Error()`));
          }
          break;

        case `UPDATE`:
          if (0 < ind2.length) {
            addOpCodeExtender(opCode, `E`);
          }
          arrayoutput.push(buildSourceLine(0, true, opCode.output, factor2, result));
          if (0 < ind2.length) {
            arrayoutput.push(buildSourceLine(0, true, `*in${ind2}`, `= %Error()`));
          }
          break;

        case `WHEN`:
          output.beforeSpaces = -indent;
          output.value = buildSourceLine(0, false, opCode.output, factor2Extended);
          output.nextSpaces = indent;
          break;

        case `WHENEQ`:
        case `WHENNE`:
        case `WHENLT`:
        case `WHENLE`:
        case `WHENGT`:
        case `WHENGE`:
          output.beforeSpaces = -indent;
          output.value = buildSourceLine(0, false, OPCODES[`WHEN`],
            factor1, EQUALITYOPERATORS[opCode.key.slice(-2)], factor2);
          output.nextSpaces = indent;
          break;

        case `WRITE`:
          if (0 < ind2.length) {
            addOpCodeExtender(opCode, `E`);
          }
          arrayoutput.push(buildSourceLine(0, true, opCode.output, factor2, result));
          if (0 < ind2.length) {
            if (ind2 !== ind3) {
              arrayoutput.push(buildSourceLine(0, true, `*in${ind2}`, `= %Error()`));
            } else {
              arrayoutput.push(buildSourceLine(0, true, `*in${ind2}`, `= %Error() or %Eof()`));
            }
          }
          if (0 < ind3.length) {
            if (ind3 !== ind2) {
              arrayoutput.push(buildSourceLine(0, true, `*in${ind3}`, `= %Eof()`));
            }
          }
          break;

        case `XFOOT`:
        {
          const evalH = 0 < opCode.extender.length ? `${OPCODES[`EVAL`]}(${opCode.extender})` : ``;
          arrayoutput.push(buildSourceLine(0, true, evalH, result, `=`, `%Xfoot(${factor2})`));
          addMathResultIndicators(arrayoutput, result, ind1, ind2, ind3);
          break;
        }

        case `XLATE`:
        {
          if (0 > opCode.extender.indexOf(`P`)) {
            output.ignore = true;
          } else {
            const wrapWithMonitor = 0 < ind2.length || 0 <= opCode.extender.indexOf(`E`);
            if (true === wrapWithMonitor) {
              arrayoutput.push(buildSourceLine(nestedIndent, true, OPCODES[`MONITOR`]));
              nestedIndent += indent;
              addSetResultIndicators(arrayoutput, nestedIndent, false, ind2);
            }
            arrayoutput.push(buildSourceLine(0, true, result, `=`, `%Xlate(${factor1}: ${factor2})`));
            if (true === wrapWithMonitor) {
              arrayoutput.push(buildSourceLine(nestedIndent - indent, true, OPCODES[`ON-ERROR`]));
              addSetResultIndicators(arrayoutput, nestedIndent, true, ind2);
              nestedIndent -= indent;
              arrayoutput.push(buildSourceLine(nestedIndent, true, OPCODES[`ENDMON`]));
            }
          }
          break;
        }

        case `Z-ADD`:
        {
          const evalH = 0 < opCode.extender.length ? `${OPCODES[`EVAL`]}(${opCode.extender})` : ``;
          arrayoutput.push(buildSourceLine(0, true, evalH, result, `=`, factor2));
          addMathResultIndicators(arrayoutput, result, ind1, ind2, ind3);
          break;
        }

        case `Z-SUB`:
        {
          const evalH = 0 < opCode.extender.length ? `${OPCODES[`EVAL`]}(${opCode.extender})` : ``;
          arrayoutput.push(buildSourceLine(0, true, evalH, result, `=`, `-${factor2}`));
          addMathResultIndicators(arrayoutput, result, ind1, ind2, ind3);
          break;
        }

        default:
          if (0 === opCode.key.length) {
            if (0 < factor2Extended.length) {
              output.aboveKeywords = factor2ExtendedWithLeadingBlanks;
            } else {
              // Set to blank
              output.change = true;
              output.value = ``;
            }
          } else {
            output.message = `Operation ${opCode.key} will not convert.`;
            output.ignore = true;
          }
          break;
      }
    }

    // Push the output value onto the output array
    // adding the ending semicolon ... as long as this
    // is not embedded SQL.
    output.value = output.value.trimEnd();
    if (0 < output.value.length) {
      arrayoutput.push(output.value + (fixedSql === true ? `` : `;`));
      output.value = ``;
    }

    if (0 < arrayoutput.length) {
      output.change = true;
    }

    // If the fixed format statement used a conditioning indicator,
    //  wrap all resulting free format statements in an IF/ENDIF
    //  block ... after identing the converted code one additonal level.
    if (fixedSql !== true && 0 < condition.ind.length && output.change === true) {
      const indentSpaces = "".padEnd(indent);
      for (const idx in arrayoutput) {
        arrayoutput[idx] = indentSpaces + arrayoutput[idx];
      }
      arrayoutput.unshift(buildSourceLine(0, true,
        OPCODES[`IF`], (condition.not ? "not" : ""),
        "*in" + condition.ind));
      arrayoutput.push(buildSourceLine(0, true, OPCODES[`ENDIF`]));
    }

    if (output.change === true) {
      output.arrayoutput = arrayoutput;
    }

    return output;

    /** Indents the liens all ready added to the outpout array */
    function indentOutputLines(arrayoutput = [], indent = 0) {
      if (0 >= indent) {
        return;
      }
      const indentSpaces = "".padEnd(indent);
      for (const idx in arrayoutput) {
        if (0 < arrayoutput[idx].length) {
          arrayoutput[idx] = indentSpaces + arrayoutput[idx]
        }
      }
    }

    /** Converts traditional syntax date/time duration to BIF function name */
    function dateTimeDurrationToBif(durrationCode = ``) {
      let bif = ``;
      switch (durrationCode.toUpperCase()) {
        case `*DAYS`:
        case `*DAY`:
        case `*D`:
          bif = `%Days`;
          break;

        case `*MONTHS`:
        case `*MONTH`:
        case `*M`:
          bif = `%Months`;
          break;

        case `*YEARS`:
        case `*YEAR`:
        case `*Y`:
          bif = `%Years`;
          break;

        case `*HOURS`:
        case `*H`:
          bif = `%Hours`;
          break;

        case `*MINUTES`:
        case `*MN`:
          bif = `%Minutes`;
          break;

        case `*SECONDS`:
        case `*S`:
          bif = `%Seconds`;
          break;

        case `*MSECONDS`:
        case `*MS`:
          bif = `%Mseconds`;
          break;
      }

      return bif;
    }

    /** Removes the given op-code extender/array of extenders from the op-code */
    function removeOpCodeExtender(opCode = {}, extender) {
      const extendersToRmv = [].concat(extender);
      let removedAnExtender = false;
      for (let idx in extendersToRmv) {
        if (0 <= opCode.extender.indexOf(extendersToRmv[idx])) {
          removedAnExtender = true;
          opCode.extender = opCode.extender.replace(extendersToRmv[idx], ``);
        }
      }

      // If we added an extender we need to rebuild the op-code output
      if (true === removedAnExtender) {
        let startIdx = opCode.output.indexOf('(');
        if (0 <= startIdx) {
          opCode.output = opCode.output.slice(0, startIdx).trim();
        }
        if (0 < opCode.extender.length) {
          opCode.output += `(${opCode.extender})`
        }
      }
    }

    /** Adds the given op-code extender/array of extenders to the op-code */
    function addOpCodeExtender(opCode = {}, extender) {
      const extendersToAdd = [].concat(extender);
      let addedAnExtender = false;
      for (let idx in extendersToAdd) {
        if (0 > opCode.extender.indexOf(extendersToAdd[idx])) {
          addedAnExtender = true;
          opCode.extender += extendersToAdd[idx];
        }
      }

      // If we added an extender we need to rebuild the op-code output
      if (true === addedAnExtender) {
        let startIdx = opCode.output.indexOf('(');
        if (0 <= startIdx) {
          opCode.output = opCode.output.slice(0, startIdx).trim();
        }
        opCode.output += `(${opCode.extender})`
      }
    }

    /** Gets an assumed-to-be-unique variable name for DO/ENDO loops */
    function getNameForTempDoIdx() {
      return `rpg_free_temporary_do_index_${++idTempDoIdx}`;
    }

    /**
     * Builds a line of code joining the parts with a space
     *
     * Builds a source line by joining the "parts" with a
     * single space, ignoring empty elements.  Optionally,
     * the semicolon can be added to the line.
     */
    function buildSourceLine(indent = 0, includeSemiColon = false, ...parts) {
      return (``.padEnd(indent) + parts.filter(Boolean).join(` `) + (includeSemiColon ? `;` : ``));
    }

    /** Pushes the setting of result indicators for math operations into the output */
    function addMathResultIndicators(output = [], result = ``, ind1 = ``, ind2 = ``, ind3 = ``) {
      if (0 < ind1.length) {
        if (ind1 === ind2) {
          if (ind1 === ind3) {
            output.push(`*in${ind1} = *ON;`)
          } else {
            output.push(`*in${ind1} = (${result} <> 0);`);
          }
        } else if (ind1 === ind3) {
          output.push(`*in${ind1} = (${result} >= 0);`);
        } else {
          output.push(`*in${ind1} = (${result} > 0);`);
        }
      }
      if (0 < ind2.length && ind2 !== ind1) {
        if (ind2 === ind3) {
          output.push(`*in${ind2} = (${result} <= 0);`);
        } else {
          output.push(`*in${ind2} = (${result} < 0);`);
        }
      }
      if (0 < ind3.length && ind3 !== ind1 && ind3 !== ind2) {
        output.push(`*in${ind3} = (${result} = 0);`);
      }
    }

    /** Pushes set on/off for the specified indicators int the output */
    function addSetResultIndicators(output = [], nestedIndent = 0, setOn = true, ...inds) {
      const onOff = setOn ? `*ON` : `*OFF`;
      const spaces = " ".repeat(nestedIndent);
      const uniqueInds = inds.filter(function (ind, pos) {
        return inds.indexOf(ind) === pos;
        });

      for (let idx in uniqueInds) {
        if (0 < uniqueInds[idx].length) {
          output.push(spaces + `*in${uniqueInds[idx]} = ${onOff};`);
        }
      }
    }

    /** Pushes the if/elseif/elsef needed to set result indicators based on comparing factor1 and factor2 */
    function addCompResultIndicators(output = [], indentSpaces = 0, factor1 = ``, factor2 = ``, ind1 = ``, ind2 = ``, ind3 = ``, caseGroup = false) {
      let ifElseif = OPCODES[`IF`];

      // If no result indicators, do nothing.
      if (0 === ind1.length && 0 === ind2.length && 0 === ind3.length) {
        return;
      }

      // If only one result indicator or they are all the same
      //  and we are doing a CASxx group, reduce the code to a
      //  simple set *ON of the indicator.
      if (true === caseGroup) {
        let setOnInd = ``;
        if (0 < ind1.length) {
          setOnInd = ind1;
        } else if (0 < ind2.length) {
          setOnInd = ind2;
        } else {
          setOnInd = ind3;
        }

        const isSingleInd = (0 === ind1.length || setOnInd === ind1)
          && (0 === ind2.length || setOnInd === ind2)
          && (0 === ind3.length || setOnInd === ind3);
        if (true === isSingleInd) {
          output.push(buildSourceLine(indentSpaces, true, `*in${setOnInd}`, `= *ON`));
          return;
        }
      }

      if (0 < ind3.length) {
        output.push(buildSourceLine(indentSpaces, true,  ifElseif, factor1, `=`, factor2));
        output.push(buildSourceLine(indentSpaces + indent, true, `*in${ind3}`, `= *ON`));
        ifElseif = OPCODES[`ELSEIF`];
      }
      if (0 < ind1.length) {
        output.push(buildSourceLine(indentSpaces, true,  ifElseif, factor1, `>`, factor2));
        output.push(buildSourceLine(indentSpaces + indent, true, `*in${ind1}`, `= *ON`));
        ifElseif = OPCODES[`ELSEIF`];
      }
      if (0 < ind2.length) {
        output.push(buildSourceLine(indentSpaces, true,  ifElseif, factor1, `<`, factor2));
        output.push(buildSourceLine(indentSpaces + indent, true, `*in${ind2}`, `= *ON`));
        ifElseif = OPCODES[`ELSEIF`];
      }
      output.push(buildSourceLine(indentSpaces, true, OPCODES['ENDIF']));
    }
  }
}
