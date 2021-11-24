const { S_IWOTH } = require("constants");
const { openSync } = require("fs");

let LastKey = ``;
let Lists = {};
let doingCALL = false;
let doingENTRY = false;
var gblFac1 = "";
var gblFac2 = "";

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
    var tmpOut = "";

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

    let Drpg3OP = {
      "EQ": "=",
      "NE": "<>",
      "GT": ">",
      "LT": "<",
      "GE": ">=",
      "LE": "<="};

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
      arrayoutput.push(LastKey + `(` + Lists[LastKey].join(`:`) + `);`);
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
        normalize_RPG3_BoolOp(plainOp, factor1, factor2, output);
        break;    
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
        normalize_Sandard_Fac1ToResult(plainOp, factor1, factor2, result, output);
        break;
      case `DO`:
        normalize_Do(N, i01, factor1, factor2, result, output, indent);
        break;
      case `DOU`:
      case `DOW`:
        output.value = opcode + ` ` + extended;
        output.nextSpaces = indent;
        EndList.push(`Enddo`);
        break;
      case `DOU`:
      case `DOUNE`:
      case `DOUGT`:
      case `DOULT`:
      case `DOUGE`:
      case `DOULE`:
      case `DOUEQ`:
        output.value = `Dou ` + factor1 + ` ` + Drpg3OP[plainOp.substr(3, 2)] + ` ` + factor2;
        output.nextSpaces = indent;
        EndList.push(`Enddo`);
        break;
      case `DOWEQ`:
      case `DOWNE`:
      case `DOWGT`:
      case `DOWLT`:
      case `DOWGE`:
      case `DOWLE`:
        output.value = `Dow ` + factor1 + ` ` + Drpg3OP[plainOp.substr(3, 2)]+ ` ` + factor2;
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
      case `OREQ`:
      case `ORNE`:
      case `ORLE`:
      case `ORLT`:
      case `ORGE`:
      case `ORGT`:
        normalize_RPG3_BoolOp(plainOp, factor1, factor2, output);
        break;
      case `CASEQ`:
      case `CASNE`:
      case `CASLE`:
      case `CASLT`:
      case `CASGE`:
      case `CASGT`:
        normalize_Cas(plainOp, factor1, factor2, result, indent, output);
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
        if (Lists[factor1.toUpperCase()])
          output.value = opcode + ` (` + Lists[factor1.toUpperCase()].join(`:`) + `) ` + factor2 + ` ` + result;
        else
          normalize_Sandard_Fac1ToResult(plainOp, factor1, factor2, result, output);
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
          output.value = opcode + ` (` + Lists[factor1.toUpperCase()].join(`:`) + `) ` + factor2;
        else
          output.value = opcode + ` ` + factor1 + ` ` + factor2;
        break;
      case `SETOFF`:
      case `SETON`:
        normalize_Set_OnOff(plainOp, arrayoutput, ind1, ind2, ind3)
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
        output.value = result + ` = ` + factor2;
        break;
      case `Z-SUB`: 
        output.value = result + ` = 0 - ` + factor2;
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
        }
        break;
      }
    } 
     

    if (output.value !== ``) {
      output.change = true;
      if (!fixedSql)
        output.value = output.value.trimRight() + `;`;
    }

    // add conditinal operation
    // DO NOT DO when a Do block is encountered
    if (i01 !== `` && plainOp !== `DO`) {
      var tmp = `If *In` + i01 + (N !== "" ? ` = *Off;` : ` = *On;`);
      tmp += `\n  ` + indentify(indent+3) + output.value + `\n` + indentify(indent+3) + `Endif;`;
      output.value = tmp;
      return output;
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

// ///////////////////////////////////////////////////////////////////////////////////////////
function indentify(num){
  var ret = "";
  for (var i=0; i <num; i++)
    ret += "  ";
  return ret;
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

    return Drpg3OP[opStr]
  }

  return "";
}

// ///////////////////////////////////////////////////////////////////////////////////////////
function normalize_RPG3_If(plainOp, factor1, factor2, output, indent){
  var op = getRpg3CompareOp(plainOp);

  output.value = `If ` + factor1 + ` ` + op + ` ` + factor2;
  output.nextSpaces = indent;
  EndList.push(`Endif`);
}

// ///////////////////////////////////////////////////////////////////////////////////////////
function normalize_Do(N, i01, factor1, factor2, result, output, indent) {
  var lin = "";
  var endStr = "";

  if (i01 !== ""){
    if (N !== "")
      lin += "if *in" + i01 + " = *Off\n"
    else
      lin += "if *in" + i01 + " = *On\n"

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
function normalize_RPG3_BoolOp(plainOp, factor1, factor2, output){
  var op = getRpg3CompareOp(plainOp);
  var keywrd = "";

  if (plainOp.substr(0, 2) == "AN"){
    keywrd = "And"
  }else {
    keywrd = "Or"
  }

  output.aboveKeywords = keywrd +` ` + factor1 + ` ` + op +` ` + factor2;
}

// ///////////////////////////////////////////////////////////////////////////////////////////
function normalize_Sandard_Fac1ToResult(plainOp, factor1, factor2, result, output){
  output.value = plainOp + ` ` + factor1 + ` ` + factor2 + ` ` + result;
}

function normalize_WhenXX(plainOp, factor1, factor2, output, indent){
  var op = getRpg3CompareOp(plainOp);

  output.beforeSpaces = -indent;
  output.value = `When ` + factor1 + ` ` + op + ` ` + factor2;
  output.nextSpaces = indent;
}

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
function normalize_Set_OnOff(plainOp, arrayoutput, ind1, ind2, ind3) {
  var value = (plainOp == "SETON")? "*On": "*Off";
  if (ind1 != ``) arrayoutput.push(`*In` + ind1 + ` = ` + value + `;`);
  if (ind2 != ``) arrayoutput.push(`*In` + ind2 + ` = ` + value + `;`);
  if (ind3 != ``) arrayoutput.push(`*In` + ind3 + ` = ` + value + `;`);
}

// ///////////////////////////////////////////////////////////////////////////////////////////
function normalize_TwoItemBIF(plainOp, factor1, factor2, result, output) {
  output.value = result + ` = %` + plainOp + `(` + factor1 + `:` + factor2 + `)`;
}

// ///////////////////////////////////////////////////////////////////////////////////////////
function normalize_Compare(factor1, factor2, ind1, ind2, ind3, output) {
  var op = "";
  var chkStr = "";
  var indicator = "";

  chkStr += (ind1 != "")?"1":"0";
  chkStr += (ind2 != "")?"1":"0";
  chkStr += (ind3 != "")?"1":"0";
  indicator = (ind1 + ind2 + ind3).trim().substr(0,2);

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
  
  output.value = `*in` + indicator + ` = (` + factor1 + ` ` + op + ` ` + factor2 + `)`;
}

// ///////////////////////////////////////////////////////////////////////////////////////////
function normalize_Cas(plainOp, factor1, factor2, result, indent, output) {
  var op = getRpg3CompareOp(plainOp);
  var lidt01 = indentify(indent + 3);
  var lidt02 = indentify(indent + 2);

  output.value = `if ` + factor1 + ` ` + op + ` ` + factor2 + `;\n` + lidt01 + `Exsr ` + result + `;\n` + lidt02 + `endif`;
}
