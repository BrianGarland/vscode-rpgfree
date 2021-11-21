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
      case `ACQ`:
        output.value = opcode + ` ` + factor1 + ` ` + factor2;
        break;
      case `ADD`:
        if (factor1)
          output.value = result + ` = ` + factor1 + ` + ` + factor2;
        else
          output.value = result + ` = ` + result + ` + ` + factor2;
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
        if (factor1)
          output.value = result + ` = ` + factor1 + ` + ` + period + `(` + factor2.split(`:`)[0] + `)`;
        else
          output.value = result + ` += ` + period + `(` + factor2.split(`:`)[0] + `)`;
        break;
      case `ANDEQ`:
      case `ANDNE`:
      case `ANDLE`:
      case `ANDLT`:
      case `ANDGE`:
      case `ANDGT`:
          output.aboveKeywords = `AND ` + factor1 + ` ` + Drpg3OP[plainOp.substr(3, 2)] +` ` + factor2;
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
        if (Lists[factor1.toUpperCase()])
          output.value = opcode + ` (` + Lists[factor1.toUpperCase()].join(`:`) + `) ` + factor2 + ` ` + result;
        else
          output.value = opcode + ` ` + factor1 + ` ` + factor2 + ` ` + result;
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
      case `DELETE`:
        output.value = opcode + ` ` + factor2;
        break;
      case `DIV`:
        output.value = result + ` = ` + factor1 + ` / ` + factor2;
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
        EndList.pop()
        break;
      case `EVAL`:
        output.value = extended;
        break;
      case `EVALR`:
      case `EVAL-CORR`:
        output.value = opcode + ` ` + extended;
        break;
      case `EXCEPT`:
      case `EXFMT`:
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
      case `IFLT`:
      case `IFEQ`:
      case `IFNE`:
      case `IFGE`:
      case `IFLE`:
          normalize_RPG3_If(plainOp, factor1, factor2, output, indent)
        /*
        output.value = `If ` + factor1 + ` ` + Drpg3OP[plainOp.substr(2,2)] + ` ` + factor2;
        output.nextSpaces = indent;
        EndList.push(`Endif`);
        */
        break;
      case `IN`:
        output.value = opcode + ` ` + factor1 + ` ` + factor2;
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
        break;
      case `READE`:
        if (Lists[factor1.toUpperCase()])
          output.value = opcode + ` (` + Lists[factor1.toUpperCase()].join(`:`) + `) ` + factor2 + ` ` + result;
        else
          output.value = opcode + ` ` + factor1 + ` ` + factor2 + ` ` + result;
        break;
      case `READP`:
        output.value = opcode + ` ` + factor2 + ` ` + result;
        break;
      case `READPE`:
        if (Lists[factor1.toUpperCase()])
          output.value = opcode + ` (` + Lists[factor1.toUpperCase()].join(`:`) + `) ` + factor2 + ` ` + result;
        else
          output.value = opcode + ` ` + factor1 + ` ` + factor2 + ` ` + result;
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
        output.nextSpaces = (indent*2);
        EndList.push(`Endsl`);
        break;
      case `SETGT`:
        if (Lists[factor1.toUpperCase()])
          output.value = opcode + ` (` + Lists[factor1.toUpperCase()].join(`:`) + `) ` + factor2;
        else
          output.value = opcode + ` ` + factor1 + ` ` + factor2;
        break;
      case `SETLL`:
        if (Lists[factor1.toUpperCase()])
          output.value = opcode + ` (` + Lists[factor1.toUpperCase()].join(`:`) + `) ` + factor2;
        else
          output.value = opcode + ` ` + factor1 + ` ` + factor2;
        break;
      case `SETOFF`:
        if (ind1 != ``) arrayoutput.push(`*In` + ind1 + ` = *Off;`);
        if (ind2 != ``) arrayoutput.push(`*In` + ind2 + ` = *Off;`);
        if (ind3 != ``) arrayoutput.push(`*In` + ind3 + ` = *Off;`);
        break;
      case `SETON`:
        if (ind1 != ``) arrayoutput.push(`*In` + ind1 + ` = *On;`);
        if (ind2 != ``) arrayoutput.push(`*In` + ind2 + ` = *On;`);
        if (ind3 != ``) arrayoutput.push(`*In` + ind3 + ` = *On;`);
        break;
      case `SORTA`:
        output.value = opcode + ` ` + extended;
        break;
      case 'SQRT':
        output.value = result + ` = %SQRT(` + factor2 + `)`;
        break;
      case `SUB`: 
        output.value = result + ` = ` + factor1 + ` - ` + factor2;
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
          if (factor1)
            output.value = result + ` = ` + factor1 + ` - ` + period + `(` + factor2.split(`:`)[0] + `)`;
          else
            output.value = result + ` -= ` + period + `(` + factor2.split(`:`)[0] + `)`;
        }
        // If factor2 doesn't have a duration then we are finding the duration between two dates 
        else       
          output.value = result.split(`:`)[0] + ` = %DIFF(` + factor1 + `:` + factor2 + `:` + result.split(`:`)[1] + `)`;
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
      case `UNLOCK`:
        output.value = opcode + ` ` + factor2;
        break;
      case `UPDATE`:
        output.value = opcode + ` ` + factor2 + ` ` + result;
        break;
        //TODO: Other WHEN conditions
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
      var tmp = `If` + (N ? ` NOT` : ``) + ` *In` + i01 + `;`;
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
