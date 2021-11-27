const { S_IWOTH } = require("constants");
const { openSync } = require("fs");
const { kill } = require("process");

let LastKey = ``;
let Lists = {};
let doingCALL = false;
let doingENTRY = false;
var gblFac1 = "";
var gblFac2 = "";
var gblCmd = "";

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

    var doAddAfter = false;
    let spaces = 0;
    let sep = ``;

    //L0N01
    let L0 = input.substr(7, 2).trim();
    let N = input.substr(9, 1).trim();
    let i01 = input.substr(10, 2).trim();

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

    let arrayoutput = [];

    plainOp = opcode;
    if (plainOp.indexOf(`(`) >= 0) {
      plainOp = opcode.substr(0, opcode.indexOf(`(`));
      extender = opcode.substring(opcode.indexOf(`(`)+1, opcode.indexOf(`)`));
    }

    if (doingCALL && plainOp != `PARM`) {
      doingCALL = false;
      arrayoutput.push(LastKey + `(` + Lists[LastKey].join(`: `) + `);`);
    }
    if (doingENTRY && plainOp != `PARM`) 
      doingENTRY = false;



    let sqltest1 = input.substr(7,9).trim().toUpperCase();
    let sqltest2 = input.substr(7,1).trim().toUpperCase();
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

    } else {
      // ----------------------------------------------------------------------------
      // primary  converion switch
      switch (plainOp) {
      case `PLIST`:
      case `KLIST`:
        LastKey = factor1.toUpperCase();
        Lists[LastKey] = [];
        if (plainOp == `PLIST` && factor1.toUpperCase() == `*ENTRY`) 
          doingENTRY = true; 
        else 
          output.remove = true; 
        break; 
      case `PARM`:
      case `KFLD`:
        //Handle var declaration
        if (doingENTRY)
          break;
        Lists[LastKey].push(result);
        output.remove = true;
        break;
      case `ANDEQ`:
      case `ANDNE`:
      case `ANDLE`:
      case `ANDLT`:
      case `ANDGE`:
      case `ANDGT`:
      case `OREQ`:
      case `ORNE`:
      case `ORLE`:
      case `ORLT`:
      case `ORGE`:
      case `ORGT`:
        normalize_RPG3_BoolOp(plainOp, factor1, factor2, output);
      case `BEGSR`:
        output.value = opcode + ` ` + factor1;
        output.nextSpaces = indent;
        break;
      case `CALL`:
        factor2 = factor2.substring(1, factor2.length-1);
        // result may containe a PLIST name
        if (result != ``) {
          if (Lists[result.toUpperCase()])
            output.value = factor2 + `(` + Lists[result.toUpperCase()].join(`:`) + `)`;
        } else {
          output.remove = true;
          LastKey = factor2.toUpperCase();
          Lists[LastKey] = [];
          doingCALL = true;
        }  
        break;
      case `CALLB`:
      case `CALLP`:
      case `EVAL`:
        output.value = extended;
        break;
      case `CAT`:
        if (factor2.indexOf(`:`) >= 0) {
          spaces = Number(factor2.split(`:`)[1]);
          factor2 = factor2.split(`:`)[0].trim();
        }
        output.value = result + ` = ` + factor1 + `+ '` + ``.padStart(spaces) + `' + ` + factor2;
        break;
      case `CLEAR`:
      case `RESET`:
        output.value = normalize_Sandard_Fac1ToResult(plainOp, factor1, factor2, result, output);
        break;
      case `DO`:
        normalize_Do(L0, N, i01, factor1, factor2, result, output, indent);
        break;
      case `DOU`:
      case `DOW`:
        output.value = opcode + ` ` + extended;
        output.nextSpaces = indent;
        EndList.push(`Enddo`);
        break;
      case `DOUNE`:
      case `DOUGT`:
      case `DOULT`:
      case `DOUGE`:
      case `DOULE`:
      case `DOUEQ`:
      case `DOWEQ`:
      case `DOWNE`:
      case `DOWGT`:
      case `DOWLT`:
      case `DOWGE`:
      case `DOWLE`:
        normalize_DoWU(plainOp, factor1, factor2, output, indent);
        break;
      case `DSPLY`:
        output.value = opcode + ` (` + factor1 + `) ` + factor2 + ` ` + result;
        break;
      case `DUMP`:
        output.value = opcode + ` ` + factor1;
        break;
      case `ELSE`:
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
      case `COMP`:
        normalize_Compare(factor1, factor2, ind1, ind2, ind3, output);
        break;
      case `ENDDO`:
      case `ENDIF`:
      case `ENDMON`:
      case `ENDSR`:
        output.beforeSpaces = -indent;
        output.value = opcode;
        break;
      case `ENDSL`:
        output.beforeSpaces = -(indent*2);
        output.value = opcode;
        EndList.pop();
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
      case `IFLT`:
      case `IFEQ`:
      case `IFNE`:
      case `IFGE`:
      case `IFLE`:
        normalize_RPG3_If(plainOp, factor1, factor2, output, indent);
        break;
      case `ITER`:
      case `LEAVE`:
      case `LEAVESR`:
        output.value = opcode;
        break;
      case `LOOKUP`:
        output.value = `*In` + ind3 + ` = (%Lookup(` + factor1 + `:` + factor2 + `) > 0)`;
        break;
      case `MONITOR`:
        output.value = opcode;
        output.nextSpaces = indent;
        break;
      case `MOVEA`:
        output.value = result + ` = ` + factor2;
        break;
      case `MOVE`:
      case `MOVEL`:
        output.move = {
          target: result,
          source: factor2,
          attr: factor1,
          dir: plainOp,
          padded: (extender === `P`)
        }
        break;
      case `MULT`:
      case `SUB`: 
      case `DIV`:
      case `ADD`:
        normalize_MathOperations(plainOp, factor1, factor2, result, output);
        break;
      case `MVR`:
        output.value = result + ` = %rem(` + gblFac1+ `: ` + gblFac2 + `)`;
        break;
      case `ON-ERROR`:
        output.beforeSpaces = -indent;
        output.value = opcode + ` ` + factor2;
        output.nextSpaces = indent;
        break;
      case 'OCCUR':
        normalize_Occur_Op(factor1, factor2, result, ind2, output, arrayoutput);
        break;
      case `CAS`:
      case `CAB`:
        normalize_Cas(plainOp, factor1, factor2, result, indent, ind1, ind2, ind3, output, arrayoutput);
        break;
      case `CASEQ`:
      case `CASNE`:
      case `CASLE`:
      case `CASLT`:
      case `CASGE`:
      case `CASGT`:
      case `CABEQ`:
      case `CABNE`:
      case `CABLE`:
      case `CABLT`:
      case `CABGE`:
      case `CABGT`:
        normalize_CasXX(plainOp, factor1, factor2, result, indent, output, arrayoutput);
        break;
      case `OTHER`:
        output.beforeSpaces = -indent;
        output.value = opcode;
        output.nextSpaces = indent;
        break;
      case `OUT`:
      case `IN`:
      case `ACQ`:
        output.value = opcode + ` ` + factor1 + ` ` + factor2;
        break;
      case `CHAIN`:
      case `READE`:
      case `READPE`:
        normalize_ChaninRead(plainOp, factor1, factor2, result, ind1, ind2, arrayoutput, output);
        doAddAfter = true;
        break;
      case `SCAN`:
      case `CHECK`:
      case `CHECKR`:
      case 'XLATE':
        normalize_TwoItemBIF(plainOp, factor1, factor2, result, output)
        break;
      case `SELECT`:
        output.value = opcode;
        output.nextSpaces = (indent*2);
        EndList.push(`Endsl`);
        break;
      case `SETGT`:
      case `SETLL`:
        if (Lists[factor1.toUpperCase()])
          output.value = opcode + ` (` + Lists[factor1.toUpperCase()].join(`: `) + `) ` + factor2;
        else
          output.value = opcode + ` ` + factor1 + ` ` + factor2;
        break;
      case `SETOFF`:
      case `SETON`:
          normalize_Set_OnOff(plainOp, indent, ind1, ind2, ind3, output, arrayoutput);
        break;
      case `SORTA`:
      case `EVALR`:
      case `EVAL-CORR`:
        output.value = opcode + ` ` + extended;
        break;
      case 'SQRT':
        output.value = result + ` = %SQRT(` + factor2 + `)`;
        break;
      case `ADDDUR`:
      case `SUBDUR`:
        normalize_SubAddDuration(plainOp, factor1, factor2, result, output);
        break;         
      case `SUBST`:
        if (factor2.indexOf(`:`) >= 0) {
          sep = factor2.split(`:`)[1];
          factor2 = factor2.split(`:`)[0].trim();
        }
        output.value = result + ` = %Subst(` + factor2 + `:` + sep + `:` + factor1 + `)`;
        break;
      case `TIME`:
        output.value = result + ` = %Time()`;
        break;
      case `TESTB`:
        normalize_TestB(factor2, result, ind1, ind2, ind3, output);
        break;
      case `RETURN`:
      case `UNLOCK`:
      case `OPEN`:
      case `EXSR`:
      case `DELETE`:
      case `CLOSE`:
      case `EXCEPT`:
      case `EXFMT`:
        output.value = opcode + ` ` + factor2;
        break;
      case `WHEN`:
        output.beforeSpaces = -indent;
        output.value = opcode + ` ` + extended;
        output.nextSpaces = indent;
        break;
      case `WHENEQ`:
      case `WHENNE`:
      case `WHENLT`:
      case `WHENLE`:
      case `WHENGT`:
      case `WHENGE`:
        normalize_WhenXX(plainOp, factor1, factor2, output, indent);
        break;
      case `READ`:
      case `READC`:
      case `READP`:
      case `UPDATE`:
      case `WRITE`:
        output.value = opcode + ` ` + factor2 + ` ` + result;
        break;
      case 'XFOOT':
        output.value = result + ` = %XFOOT(` + factor2 + `)`;
        break;
      case `Z-ADD`:
      case `Z-SUB`: 
          normalize_Z_AddSub(plainOp, factor2, result, ind1, ind2, ind3, output, arrayoutput);
        break;

      default:
        if (plainOp == ``) {
          if (extended !== ``) {
            output.aboveKeywords = extended;
          } else {
            if (L0 !== `` || i01 !== ``){
              normalize_ControlInd_Cascade(output, L0, N, i01);
              doAddAfter = true;
            }
            else{
              //Set to blank
              output.change = true;
              output.value = ``;
            }
          }
        } else {
          output.message = `Operation ` + plainOp + ` will not convert.`;
        }
        break;
      }
    } 
     

    if (output.value !== ``) {
      output.change = true;

      if (!fixedSql)
        if (output.value !== undefined)
          output.value = output.value.trimRight() + `;`;
    }

    // add conditinal operation
    // DO NOT DO when a Do block is encountered
    // Do blocks are handled with  normalize_DO
    if (i01 !== `` && plainOp !== `DO`) {
      normalize_ControlLevel_indicators(L0, N, i01, plainOp, indent, output, arrayoutput);
      doAddAfter = true;
    }

    if (arrayoutput.length > 0) {
      output.change = true;

      if (doAddAfter == false){
        if (output.value !== ``) {
          arrayoutput.push(`  ` + output.value);
          output.value = ``;
        }
        output.arrayoutput = arrayoutput;
      } else {
        if (output.value !== "")
          output.arrayoutput = [output.value].concat(arrayoutput);
        else
          output.arrayoutput = arrayoutput;
        output.value = ``;
      }
    }
    return output;
  }
}

// ///////////////////////////////////////////////////////////////////////////////////////////
function indentify(num){
  var ret =  ` `;
  return ret.repeat(num);
}

// ///////////////////////////////////////////////////////////////////////////////////////////
function getRpg3CompareOp(opKeyWord){
  let Drpg3OP = {
    "EQ": "=",
    "NE": "<>",
    "GT": ">",
    "LT": "<",
    "GE": ">=",
    "LE": "<="
  };

  var len = opKeyWord.length;

  if (opKeyWord.length > 2){
    var L2 = len - 2;
    var opStr = opKeyWord.substr(L2, 2);

    if (opStr in Drpg3OP)
      return Drpg3OP[opStr];
  }

  return "";
}

// ///////////////////////////////////////////////////////////////////////////////////////////
function getIndicatorComparisonOp(ind1, ind2, ind3){
  var chkStr = "";
  var op = "";

  chkStr += (ind1 != "")?"1":"0";
  chkStr += (ind2 != "")?"1":"0";
  chkStr += (ind3 != "")?"1":"0";

  switch(chkStr){
    case "001":
      op = "=";
      break;
    case "010":
      op = ">";
      break;
    case "011":
      op = ">=";
      break;
    case "100":
      op = "<";
      break;
    case "101":
      op = "<=";
      break;
    case "110":
      op = "<>";
      break;
  }

  return op;
}

// ///////////////////////////////////////////////////////////////////////////////////////////
function normalize_RPG3_If(plainOp, factor1, factor2, output, indent){
  var op = getRpg3CompareOp(plainOp);

  output.value = `If ` + factor1 + ` ` + op + ` ` + factor2;
  output.nextSpaces = indent;
  EndList.push(`Endif`);
}

// ///////////////////////////////////////////////////////////////////////////////////////////
function normalize_DoWU(plainOp, factor1, factor2, output, indent) {
  var keywrd = "";

  if (plainOp.substr(0,3) == `DOW`)
    keywrd = `Dow`;
  else
    keywrd = `Dou`;

  output.value = keywrd + ` ` + factor1 + ` ` + getRpg3CompareOp(plainOp) + ` ` + factor2;
  output.nextSpaces = indent;
  EndList.push(`Enddo`);
}

// ///////////////////////////////////////////////////////////////////////////////////////////
function normalize_Do(L0, N, i01, factor1, factor2, result, output, indent) {
  var lin = "";
  var endStr = "";

  if (i01 !== ""){
    // encountered a multiline control
    if (L0 !== ""){
      normalize_ControlInd_Cascade(output, L0, N, i01);
      lin = output.aboveKeywords;
      gblCmd = "";
    } else {
      lin = `If *in` + i01 + " = ";
      lin += (N === "")? `*On`: `*Off`;
    }

    output.value = lin; 
    
    endStr = "Endif";
  }else{
    if (factor1 === ""){
      output.value = `For ` + result + ` to ` + factor2;
      endStr = "Endfor";
    } else {
      output.value = `For ` + result + ` = ` + factor1 + ` to ` + factor2;
      endStr = "Endfor";
    }
  }

  output.nextSpaces = indent;
  EndList.push(endStr);
}

// ///////////////////////////////////////////////////////////////////////////////////////////
function normalize_RPG3_BoolOp(plainOp, factor1, factor2, output) {
  var op = getRpg3CompareOp(plainOp);
  var keywrd = "";
  var tmp = "";

  if (plainOp.substr(0, 2) == "AN"){
    keywrd = "And"
  }else {
    keywrd = "Or"
  }

  tmp = keywrd + ` ` + factor1 + ` ` + op + ` ` + factor2;
  output.aboveKeywords = tmp;
}

// ///////////////////////////////////////////////////////////////////////////////////////////
function normalize_ControlInd_Cascade(output, L0, N, i01) {
  var op = "";
  var chk = "";
  var tmp = "";

  switch(L0){
    case "AN":
      op = "And";
      break;
    case "OR":
      op = "Or";
      break;
    default:
      op = "If";
      break;
  }

  if (N === "")
    chk = "*On";
  else
    chk = "*Off";

  tmp += op + ` *in` + i01 + ` = ` + chk + ` `;
  if ((gblCmd.includes(tmp)) === false)
    gblCmd += tmp;

  output.remove = true;
}

// ///////////////////////////////////////////////////////////////////////////////////////////
function normalize_Sandard_Fac1ToResult(plainOp, factor1, factor2, result, output){
  return plainOp + ` ` + factor1 + ` ` + factor2 + ` ` + result;
}

// ///////////////////////////////////////////////////////////////////////////////////////////
function normalize_WhenXX(plainOp, factor1, factor2, output, indent){
  var op = getRpg3CompareOp(plainOp);

  output.beforeSpaces = -indent;
  output.value = `When ` + factor1 + ` ` + op + ` ` + factor2;
  output.nextSpaces = indent;
}

// ///////////////////////////////////////////////////////////////////////////////////////////
function normalize_MathOperations(plainOp, factor1, factor2, result, output){
  var op = "";
  let dKeyWrd = {
    "ADD": "+",
    "MULT": "*",
    "DIV": "/",
    "SUB": "-"
  };

  // get freeformat math operation
  op = dKeyWrd[plainOp];

  // on devide save the factors
  if (op == "/"){
    gblFac1 = factor1;
    gblFac2 = factor2;
  }

  if (factor1 !== "")
    output.value = result + ` = ` + factor1 + ` ` + op + ` ` + factor2;
  else
    output.value = result + ` ` + op +`= ` + factor2;
}

// ///////////////////////////////////////////////////////////////////////////////////////////
function normalize_SubAddDuration(plainOp, factor1, factor2, result, output){
  var period = "";
  var keyOp = "";
  var facArr = factor2.split(`:`);

  // convert duration to BIF
  switch (facArr[1]) {
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
  
  // get mathmatic opertion
  if (plainOp.substr(0,2) == "AD")
    keyOp = "+";
  else
    keyOp = "-";

  // apply convertion
  if (factor1)
    output.value = result + ` = ` + factor1 + ` ` + keyOp + ` ` + period + `(` + facArr[0] + `)`;
  else
    output.value = result + ` ` + keyOp + `= ` + period + `(` + facArr[0] + `)`;
}

// ///////////////////////////////////////////////////////////////////////////////////////////
function normalize_Set_OnOff(plainOp, indent, ind1, ind2, ind3, output, arrayoutput) {
  var value = (plainOp == "SETON")? "*On": "*Off";

  // set array output
  if (ind1 != ``) arrayoutput.push(`*In` + ind1 + ` = ` + value + `;`);
  if (ind2 != ``) arrayoutput.push(`*In` + ind2 + ` = ` + value + `;`);
  if (ind3 != ``) arrayoutput.push(`*In` + ind3 + ` = ` + value + `;`);

  // clear output value
  output.value = ``;
}

// ///////////////////////////////////////////////////////////////////////////////////////////
function normalize_TwoItemBIF(plainOp, factor1, factor2, result, output) {
  output.value = result + ` = %` + plainOp + `(` + factor1 + `:` + factor2 + `)`;
}

// ///////////////////////////////////////////////////////////////////////////////////////////
function normalize_Compare(factor1, factor2, ind1, ind2, ind3, output) {
  var op = "";
  var indicator = "";

  indicator = (ind1 + ind2 + ind3).trim().substr(0,2);
  op = getIndicatorComparisonOp(ind1, ind2, ind3);
  
  output.value = `*in` + indicator + ` = (` + factor1 + ` ` + op + ` ` + factor2 + `)`;
}

// ///////////////////////////////////////////////////////////////////////////////////////////
function normalize_CasXX(plainOp, factor1, factor2, result, indent, output, arrayoutput) {
  var op = getRpg3CompareOp(plainOp);
  var locInd = indentify(indent);

  arrayoutput.push(`if ` + factor1 + ` ` + op + ` ` + factor2);
  
  // apply the body of the if statement
  // CAB gets a comment because GOTO is not aloud 
  if (plainOp.substr(0,3) == `CAS`) {
    arrayoutput.push(locInd + `Exsr ` + result + `;`);
  } else {
    arrayoutput.push(locInd + `// goto ` + result)
  }

  arrayoutput.push(`Endif;`);
  output.value = ``;
}

// ///////////////////////////////////////////////////////////////////////////////////////////
function normalize_Cas(plainOp, factor1, factor2, result, indent, ind1, ind2, ind3, output, arrayoutput) {
  var locInd = indentify(indent);
  var op = getIndicatorComparisonOp(ind1, ind2, ind3);

  arrayoutput.push(`if ` + factor1 + ` ` + op + ` ` + factor2);
  
  // apply the body of the if statement
  // CAB gets a comment because GOTO is not aloud 
  if (plainOp == `CAS`) {
    arrayoutput.push(locInd + `Exsr ` + result + `;`);
  } else {
    arrayoutput.push(locInd + `// goto ` + result)
  }

  arrayoutput.push(`Endif;`);
  output.value = ``;
}

// ///////////////////////////////////////////////////////////////////////////////////////////
function normalize_ControlLevel_indicators(L0, N, i01, plainOp, indent, output, arrayoutput) {
  var tmp = "";
  var locInd = indentify(indent);

  // encountered a multiline control
  normalize_ControlInd_Cascade(output, L0, N, i01);

  if (gblCmd !== "" && plainOp !== ""){
    tmp = gblCmd.trim() + `;`;
    gblCmd = "";
  } else {
    // do nothing, line is incompleate
    output.value = ``;
    return;
  }

  // add op-code statement to if block
  arrayoutput.push(tmp);
  arrayoutput.push(locInd + output.value);
  arrayoutput.push(`Endif`);
  output.value = ``;
  output.remove = false;
}

// ///////////////////////////////////////////////////////////////////////////////////////////
function normalize_ChaninRead(plainOp, factor1, factor2, result, ind1, ind2, arrayoutput, output) {
  var line = ``;
  var klst = factor1.toUpperCase();

  if (Lists[klst]) 
    line = plainOp + ` (` + Lists[klst].join(`: `) + `) ` + factor2 + ` ` + result;
  else {
    line = normalize_Sandard_Fac1ToResult(plainOp, factor1, factor2, result, output);
  }
  
  line = line.trim();

  if (ind1 !== "")
    arrayoutput.push(`*in` + ind1 + ` = (%found() = *Off);`);
  
  if (ind2 !== "")
    arrayoutput.push(`*in` + ind2 + ` = %error();`);
  
    output.value = line;
}

// ///////////////////////////////////////////////////////////////////////////////////////////
function normalize_Z_AddSub(plainOp, factor2, result, ind1, ind2, ind3, output, arrayoutput) {
  var tmp = "";
  var op = "";
  tmp = ind1.trim() + ind2.trim() + ind3.trim();

  if (plainOp == `Z-ADD`)
    op = ` = `;
  else
    op = ` = 0 - `

  if (tmp === "")
    output.value = result + op + factor2;
  else {
    output.value =``;
    arrayoutput.push(result + op + factor2 + `;`);
    if (ind1 !== "") arrayoutput.push(`*in` + ind1 + ` = (` + result + ` > 0);`);
    if (ind2 !== "") arrayoutput.push(`*in` + ind2 + ` = (` + result + ` < 0);`);
    if (ind3 !== "") arrayoutput.push(`*in` + ind3 + ` = (` + result + ` = 0);`);
  }
}

// ///////////////////////////////////////////////////////////////////////////////////////////
function normalize_TestB(factor2, result, ind1, ind2, ind3, output) {
  var tmp = "";

  tmp = `%Bitand(` + result + `: ` + factor2 + `)`;

  if (ind1 !== "")
    tmp = `*in` + ind1 + ` = (` + tmp + ` = x'00')`;
  else {
    if (ind3 !== "")
      tmp = `*in` + ind3 + ` = (` + tmp + ` = ` + factor2 + `)`;
    else
      tmp = `*in` + ind2 + ` = (` + tmp + ` = x'00' And ` + tmp + ` <> ` + factor2 + `)`;
  }
  output.value = tmp;
}

// ///////////////////////////////////////////////////////////////////////////////////////////
function normalize_Occur_Op(factor1, factor2, result, ind2, output, arrayoutput) {
  var tmp;

  if (factor1 === "")
    tmp = result + ` = % Occur(` + factor2 + `)`;
  else
    tmp = ` = % Occur(` + factor1 + `) = ` + factor2;

  if (ind2 === "")
    output.value = tmp;
  else {
    output.value = ``;
    arrayoutput.push(tmp + `;`);
    arrayoutput.push(`*in` + ind2 ` = %Error();`);
  }
}
