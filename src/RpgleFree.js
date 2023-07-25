const specs = {
  'C': require(`./specs/C`),
  'F': require(`./specs/F`),
  'D': require(`./specs/D`),
  'H': require(`./specs/H`),
  'P': require(`./specs/P`)
};

class Message {
  constructor(line, text) {
    this.line = line;
    this.text = text;
  }
}

module.exports = class RpgleFree {
  constructor(lines, indent) {
    this.currentLine = -1;
    this.lines = lines;
    this.indent = indent;
    this.vars = {
      '*DATE': {
        name: `*DATE`,
        type: `D`,
        len: 10
      }
    };

    this.messages = [];
  }

  addVar(obj) {
    if (obj.standalone === true)
      this.vars[obj.name.toUpperCase()] = obj;
  }

  suggestMove(obj) {
    let result = {
      change: false,
      value: ``
    }

    let sourceVar = this.vars[obj.source.toUpperCase()];
    let targetVar = this.vars[obj.target.toUpperCase()];

    if (sourceVar === undefined) {
      if (obj.source.startsWith(`'`)) { //This means it's a character
        sourceVar = {
          name: obj.source,
          type: `A`,
          len: (obj.source.length - 2)
        }

        if (targetVar === undefined) {
          //Basically.. if we're assuming that if the targetvar
          //is undefined (probably in a file) but we are moving
          //character date into it, let's assume it's a char field

          this.messages.push(new Message(this.currentLine, `Assuming ` + obj.target + ` is a character field for MOVE/MOVEL operation.`));

          targetVar = {
            name: obj.target,
            type: `A`
          };
        }
      } else if (obj.source.startsWith(`*`)) {
        sourceVar = {
          name: obj.source,
          type: `S` //I think we can pretend it's numeric and it'll still work
        }
      } else { //Is numeric
        sourceVar = {
          name: obj.source,
          type: `S`,
          len: obj.source.length
        }
      }
      sourceVar.const = true;
    } else {
      switch (sourceVar.type) {
      case `D`:
        sourceVar.len = 10;
        sourceVar.const = true;
        break;
      case `T`:
        sourceVar.len = 8;
        sourceVar.const = true;
        break;
      }
    }

    if (targetVar === undefined && sourceVar !== undefined) {
      this.messages.push(new Message(this.currentLine, `Assuming ` + obj.target + ` is a type '` + sourceVar.type + `' for MOVE/MOVEL operation.`));
      //Here we are assuming the target type based on the source type :)
      targetVar = {
        name: obj.target,
        type: sourceVar.type
      }
    }

    if (targetVar !== undefined) {
      let assignee = targetVar.name;

      switch (targetVar.type) {
      case `S`: //numeric (not specific to packed or zoned)
        result.value = assignee + ` = ` + sourceVar.name;
        break;

      case `D`: //date
        if (sourceVar.name.toUpperCase() === `*DATE`) {
          result.value = targetVar.name + ` = ` + sourceVar.name;
        } else {
          if (obj.attr === ``)
            result.value = targetVar.name + ` = %Date(` + sourceVar.name + `)`;
          else
            result.value = targetVar.name + ` = %Date(` + sourceVar.name + `:` + obj.attr + `)`;
        }
        break;

      case `A`: //character
        if (obj.padded) {
          if (obj.dir === `MOVEL`)
            assignee = targetVar.name;
          else
            assignee = `EvalR ` + targetVar.name;
        } else {
          if (obj.dir === `MOVEL`)
            if (sourceVar.const)
              assignee = `%Subst(` + targetVar.name + `:1:` + sourceVar.len + `)`;
            else
              assignee = `%Subst(` + targetVar.name + `:1:%Len(` + sourceVar.name + `))`;
          else
          if (sourceVar.const)
            assignee = `%Subst(` + targetVar.name + `:%Len(` + targetVar.name + `)-` + sourceVar.len + `)`;
          else
            assignee = `%Subst(` + targetVar.name + `:%Len(` + targetVar.name + `)-%Len(` + sourceVar.name + `))`;
        }

        switch (sourceVar.type) {

        case `A`:
          result.value = assignee + ` = ` + sourceVar.name;
          break;

        case `S`:
        case `P`:
        case `I`:
        case `F`:
        case `U`:
          result.value = assignee + ` = %Char(` + sourceVar.name + `)`;
          break;

        case `D`:
        case `T`:
          if (obj.attr !== ``)
            result.value = assignee + ` = %Char(` + sourceVar.name + `:` + obj.attr + `)`;
          else
            result.value = assignee + ` = %Char(` + sourceVar.name + `)`;
        }

        break;
      }

    }

    if (result.value !== ``) {
      result.change = true;
      result.value = result.value.trimRight() + `;`;
    } else {
      this.messages.push(new Message(this.currentLine, `Unable to convert MOVE/MOVEL operation.`));
    }
    return result;
  }

  parse() {
    let length = this.lines.length;
    let line, nextline, comment, isMove, hasKeywords, ignoredColumns, spec, spaces = 0;
    let result, testForEnd;
    let wasSub = false;
    let wasLIKEDS = false;
    let fixedSql = false;
    let lastBlock = ``;
    let index = 0;
    for (index = 0; index < length; index++) {
      if (this.lines[index] === undefined) continue;

      this.currentLine = index;

      comment = ``;
      line = ` ` + this.lines[index].padEnd(80);
      if (line.length > 81) {
        line = line.substring(0, 81);
        comment = this.lines[index].substring(80);
      }

      ignoredColumns = line.substring(1, 4);

      if (this.lines[index+1]) {
        nextline = ` ` + this.lines[index+1].padEnd(80);
        if (nextline.length > 81)
          nextline = nextline.substring(0, 81);
      } else
        nextline = ``;

      spec = line[6].toUpperCase();

      switch (line[7]) {
      case `/`:
        let test = line.substring(8,16).trim().toUpperCase();
        switch (test) {
        case `EXEC SQL`:
          // deal with embedded SQL just like normal c-specs
          fixedSql = true;
          spec = `C`;
          break;
        case `END-EXEC`:
          // deal with embedded SQL just like normal c-specs
          fixedSql = false;
          spec = `C`;
          break;
        case `FREE`:
        case `END-FREE`:
          spec = ``;
          this.lines.splice(index, 1);
          index--;
          break;
        default:
          spec = ``;
          this.lines[index] = ``.padEnd(7) + ``.padEnd(spaces) + line.substring(7).trim();
          break;
        }
        break;

      case `*`:
        spec = ``;

        comment = line.substring(8).trimEnd();
        if (comment !== ``)
          this.lines[index] = ``.padEnd(8) + ``.padEnd(spaces) + `//` + comment;
        else
          this.lines[index] = ``;
        break;

      case `+`:
        // deal with embedded SQL just like normal c-specs
        if (fixedSql)
          spec = `C`;
        break;

      }

      if (specs[spec] !== undefined) {
        result = specs[spec].Parse(line, this.indent, wasSub, wasLIKEDS);

        if (result.isSub === true) {
          if (result.isHead === true && wasSub && !wasLIKEDS) {
            endBlock(this.lines,this.indent);
          }
          wasSub = true;
          lastBlock = result.blockType;

        } else if (result.isSub === undefined && wasSub) {
          endBlock(this.lines,this.indent);
        }

        wasLIKEDS = (result.isLIKEDS === true);

        if (result.var !== undefined)
          this.addVar(result.var);

        isMove = (result.move !== undefined);
        hasKeywords = (result.aboveKeywords !== undefined);

        if (result.message) {
          this.messages.push(new Message(this.currentLine, result.message));
        }

        switch (true) {
        case result.ignore:
          break;

        case isMove:
          result = this.suggestMove(result.move);
          if (result.change) {
            this.lines[index] = ignoredColumns + `    ` + ``.padEnd(spaces) + result.value;
          }
          break;

        case hasKeywords:
          let endStmti = this.lines[index - 1].indexOf(`;`);
          let endStmt = this.lines[index - 1].substring(endStmti); //Keep those end line comments :D

          this.lines[index - 1] = this.lines[index - 1].substring(0, endStmti) + ` ` + result.aboveKeywords + endStmt;
          this.lines.splice(index, 1);
          index--;
          break;

        case result.remove:
          if (comment.trim() !== ``) {
            this.lines[index] = ignoredColumns + `    ` + ``.padEnd(spaces) + `//` + comment;
          } else {
            this.lines.splice(index, 1);
            index--;
            length++;
          }
          break;

        case result.change:
          spaces += result.beforeSpaces;
          // no break, need default logic too

        default:

          if (result.arrayoutput) {

            this.lines.splice(index, 1);

            for (let y in result.arrayoutput) {
              result.arrayoutput[y] = ignoredColumns + `    ` + ``.padEnd(spaces) + result.arrayoutput[y];

              this.lines.splice(index, 0, result.arrayoutput[y]);
              //result.arrayoutput.pop();

              index++;
              length++;
            }
            while (result.arrayoutput.length > 0) {
              result.arrayoutput.pop();
            }

            index--;

          } else {

            this.lines[index] = ignoredColumns + `    ` + ``.padEnd(spaces) + result.value;
            if (comment.trim() !== ``) {
              this.lines[index] += ` //` + comment;
            }

          }

          spaces += result.nextSpaces;
          break;

        }

      } else {
        if (wasSub && line[7] !== `*`) {
          endBlock(this.lines,this.indent);
        }
      }
    }



    // catch any held info incase the last line was not a "spec"
    if (result.arrayoutput) {

      this.lines.splice(index, 1);

      for (let y in result.arrayoutput) {
        result.arrayoutput[y] = ignoredColumns + `    ` + ``.padEnd(spaces) + result.arrayoutput[y];

        this.lines.splice(index, 0, result.arrayoutput[y]);
        index++;
        length++;
      }

    }



    function endBlock(lines,indent) {
      spaces -= indent;
      if (lastBlock !== undefined && lastBlock !== ``) {
        lines.splice(index, 0, ``.padEnd(8) + ``.padEnd(spaces) + `End-` + lastBlock + `;`);
        index++;
        length++;
      }
      wasSub = false;
    }

  }

}
