const { Breakpoint } = require("vscode");

const specs = {
  C: require(`./specs/C`),
  F: require(`./specs/F`),
  D: require(`./specs/D`),
  H: require(`./specs/H`),
  P: require(`./specs/P`),
};

class Message {
  constructor(line, text) {
    this.line = line;
    this.text = text;
  }
}

module.exports = class RpgleFree {
  constructor(lines = [], indent = 2) {
    this.currentLine = -1;
    this.lines = lines;
    this.indent = indent;
    this.vars = {
      "*DATE": {
        name: `*DATE`,
        type: `D`,
        len: 10,
      },
    };

    this.messages = [];
  }

  addVar(obj) {
    if (obj.standalone === true) this.vars[obj.name.toUpperCase()] = obj;
  }

  suggestMove(obj) {
    let result = {
      change: false,
      value: ``,
    };

    let sourceVar = this.vars[obj.source.toUpperCase()];
    let targetVar = this.vars[obj.target.toUpperCase()];

    if (sourceVar === undefined) {
      if (obj.source.startsWith(`'`)) {
        // This means it's a character
        sourceVar = {
          name: obj.source,
          type: `A`,
          len: obj.source.length - 2,
        };

        if (targetVar === undefined) {
          // Basically.. if we're assuming that if the targetvar
          // is undefined (probably in a file) but we are moving
          // character date into it, let's assume it's a char field
          this.messages.push(
            new Message(
              this.currentLine,
              `Assuming ${obj.target} is a 'Char' field for MOVE/MOVEL operation.`
            )
          );

          targetVar = {
            name: obj.target,
            type: `A`,
          };
        }
      } else if (obj.source.startsWith(`*`)) {
        // I think we can pretend keywords are numeric and it'll still work
        sourceVar = {
          name: obj.source,
          type: `S`,
        };
      } else {
        // Is numeric
        sourceVar = {
          name: obj.source,
          type: `S`,
          len: obj.source.length,
        };
      }
      sourceVar.const = true;
    } else {
      switch (sourceVar.type.toUpperCase()) {
        case `D`:
          sourceVar.len = 10;
          sourceVar.const = true;
          break;
        case `T`:
          sourceVar.len = 8;
          sourceVar.const = true;
          break;
        case `Z`:
          sourceVar.len = 26;
          sourceVar.const = true;
          break;
        }
    }

    if (targetVar === undefined && sourceVar !== undefined) {
      this.messages.push(
        new Message(
          this.currentLine,
          `Assuming ${obj.target} is a type '${sourceVar.type}' for MOVE/MOVEL operation.`
        )
      );
      //Here we are assuming the target type based on the source type :)
      targetVar = {
        name: obj.target,
        type: sourceVar.type,
      };
    }

    if (targetVar !== undefined) {
      let assignee = targetVar.name;

      switch (targetVar.type.toUpperCase()) {
        case `S`: // numeric (not specific to packed or zoned)
          result.value = `${assignee} = ${sourceVar.name}`;
          break;

        case `D`: // date
          if (sourceVar.name.toUpperCase() === `*DATE`) {
            result.value = `${targetVar.name} = ${sourceVar.name}`;
          } else {
            if (obj.attr === ``)
              result.value = `${targetVar.name} = %Date(${sourceVar.name})`;
            else
              result.value = `${targetVar.name} = %Date(${sourceVar.name}: ${obj.attr})`;
          }
          break;

        case `A`: // character
        case `C`: // ucs2
          const isMoveLeft = (obj.dir.toUpperCase() === `MOVEL`);
          if (obj.padded) {
            if (isMoveLeft) {
              assignee = targetVar.name;
            } else {
              assignee = `EvalR ${targetVar.name}`;
            }
          } else {
            if (isMoveLeft) {
              if (sourceVar.const)
                assignee = `%Subst(${targetVar.name}: 1: ${sourceVar.len})`;
              else
                assignee = `%Subst(${targetVar.name}: 1: %Len(${sourceVar.name}))`;
            } else {
              if (sourceVar.const)
                assignee = 
                  `%Subst(${targetVar.name}: %Len(${targetVar.name}) - ${sourceVar.len})`;
              else
                assignee = 
                  `%Subst(${targetVar.name}: %Len(${targetVar.name}) - %Len(${sourceVar.name}))`;
            }
          }

          switch (sourceVar.type.toUpperCase()) {
            case `A`:
            case `C`:
              result.value = `${assignee} = ${sourceVar.name}`;
              break;

            case `S`:
            case `P`:
            case `I`:
            case `F`:
            case `U`:
              result.value = `${assignee} = %Char(${sourceVar.name})`;
              break;

            case `D`:
            case `T`:
            case `Z`:
                if (obj.attr !== ``) {
                result.value = `${assignee} = %Char(${sourceVar.name}: ${obj.attr})`;
              } else {
                result.value = `${assignee} = %Char(${sourceVar.name})`;
              }
          }
          break;
      }
    }

    if (result.value !== ``) {
      result.change = true;
      result.value = result.value.trimRight() + `;`;
    } else {
      this.messages.push(
        new Message(this.currentLine, `Unable to convert MOVE/MOVEL operation.`)
      );
    }
    return result;
  }

  parse() {
    let length,
      line,
      nextline,
      comment,
      isMove,
      hasKeywords,
      ignoredColumns,
      spec,
      spaces = 0;
    let result, testForEnd;
    let wasSub = false;
    let wasLIKEDS = false;
    let fixedSql = false;
    let lastBlock = ``;
    let index = 0;
    let isCommentLine = false;

    length = this.lines.length;
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

      if (this.lines[index + 1]) {
        nextline = ` ` + this.lines[index + 1].padEnd(80);
        if (nextline.length > 81) {
          nextline = nextline.substring(0, 81);
        }
      } else {
        nextline = ``;
      }

      spec = line[6].toUpperCase();
      isCommentLine = line[7] === `*` || 0 == line.trim().indexOf(`//`);
      if (isCommentLine) {
        spec = ``;
        // For ILEDocs, the start comment block `/**` should
        //  be converted to `///`.  Likewise, the end comment
        //  block ` */` should be converted to '///'.  For these
        //  to be true ILEDocs start/end markers they must start
        //  in position 6.
        const ILEDocStartEndComment = line.substring(6).trimEnd();
        if (ILEDocStartEndComment === `/**`) {
          comment = `/`;
        } else if (ILEDocStartEndComment === ` */`) {
          comment = `/`;
        } else if (line[7] === `*`) {
          comment = line.substring(8).trimEnd();
        } else {
          comment = line.slice(line.indexOf(`//`) + 2).trimEnd();
        }
        // Previously, we would remove a blank comment line.
        // However, in order to get to this point, the line was not
        // blank, but was literally commented.  So, keep the "comment"
        // even if it is blank.
        this.lines[index] = ``.padEnd(7) + ``.padEnd(spaces) + `//` + comment;
      } else {
        switch (line[7]) {
          case `/`:
            let test = line.substring(8, 16).trim().toUpperCase();
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
                continue;
                break;
              default:
                spec = ``;
                this.lines[index] =
                  ``.padEnd(7) + ``.padEnd(spaces) + line.substring(7).trim();
                break;
            }
            break;

          case `+`:
            // deal with embedded SQL just like normal c-specs
            if (fixedSql) spec = `C`;
            break;
        }
      }

      if (specs[spec] !== undefined) {
        result = specs[spec].Parse(line, this.indent, wasSub, wasLIKEDS);

        if (result.isSub === true) {
          if (result.isHead === true && wasSub && !wasLIKEDS) {
            endBlock(this.lines, this.indent);
          }
          wasSub = true;
          lastBlock = result.blockType;
        } else if (result.isSub === undefined && wasSub) {
          endBlock(this.lines, this.indent);

          // Fixed format RPG does not allow nested DS.
          //  If the current block is DS and the previous was
          //  also a DS, then we need to force an end.
          //  This is required for DS defined with an EXTNAME
          //  as they may or may not have subfields.
        } else if (result.blockType === `DS` && wasSub) {
          endBlock(this.lines, this.indent);
        }

        wasLIKEDS = result.isLIKEDS === true;

        if (result.var !== undefined) this.addVar(result.var);

        isMove = result.move !== undefined;
        hasKeywords = result.aboveKeywords !== undefined;

        if (result.message) {
          this.messages.push(new Message(this.currentLine, result.message));
        }

        switch (true) {
          case result.ignore:
            break;

          case isMove:
            result = this.suggestMove(result.move);
            if (result.change) {
              this.lines[index] =
                ignoredColumns + `    ` + ``.padEnd(spaces) + result.value;
            }
            break;

          case hasKeywords:
            let endStmti = this.lines[index - 1].indexOf(`;`);
            let endStmt = this.lines[index - 1].substring(endStmti); //Keep those end line comments :D

            this.lines[index - 1] =
              this.lines[index - 1].substring(0, endStmti) +
              ` ` +
              result.aboveKeywords +
              endStmt;
            this.lines.splice(index, 1);
            index--;

            this.lines[index] = postProcessKeyWords(
              this.lines[index],
              result.blockType
            );
            break;

          case result.remove:
            if (comment.trim() !== ``) {
              this.lines[index] =
                ignoredColumns + `    ` + ``.padEnd(spaces) + `//` + comment;
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
                result.arrayoutput[y] =
                  ignoredColumns +
                  `    ` +
                  ``.padEnd(spaces) +
                  result.arrayoutput[y];

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
              this.lines[index] =
                ignoredColumns + `    ` + ``.padEnd(spaces) + result.value;
              this.lines[index] = postProcessKeyWords(
                this.lines[index],
                result.blockType
              );

              if (comment.trim() !== ``) {
                this.lines[index] += ` //` + comment;
              }
            }

            spaces += result.nextSpaces;
            break;
        }
      } else {
        if (wasSub && !isCommentLine) {
          endBlock(this.lines, this.indent);
        }
      }
    }

    // catch any held info incase the last line was not a "spec"
    if (result.arrayoutput) {
      this.lines.splice(index, 1);
      for (let y in result.arrayoutput) {
        result.arrayoutput[y] =
          ignoredColumns + `    ` + ``.padEnd(spaces) + result.arrayoutput[y];

        this.lines.splice(index, 0, result.arrayoutput[y]);
        index++;
        length++;
      }
    }

    function endBlock(lines, indent) {
      if (lastBlock !== undefined && lastBlock !== ``) {
        spaces -= indent;
        lines.splice(
          index,
          0,
          ``.padEnd(7) + ``.padEnd(spaces) + `End-` + lastBlock + `;`
        );
        index++;
        length++;
      }
      wasSub = false;
    }

    /** Quotes the EXTNAME and EXTFLD values */
    function quoteExtNameValue(line = ``, blockType = ``) {
      // This only applys to DS block types
      if (blockType !== `DS`) {
        return line;
      }

      // If we cannot find the EXTNAME/EXTFLD with the
      //  following value in parens, then do nothing.
      let regexResults = line.match(
        /^(.* (EXTNAME|EXTFLD) *?\()([^\)]+)(\).*)$/i
      );
      if (!regexResults || regexResults.length !== 5) {
        return line;
      }

      // If the value is already quoted, do nothing.
      let extNameValue = regexResults[3].trim().toUpperCase();
      if (extNameValue.substr(0, 1) === `'`) {
        return line;
      }

      return regexResults[1] + `'` + extNameValue + `'` + regexResults[4];
    }

    /** Fixes the varying keyword by removing it and prepending Var to data type */
    function fixVaryingKeyword(line = ``, blockType = ``) {
      // This only applys to DS block types
      if (blockType !== `DS` && 0 != line.trimLeft().indexOf(`Dcl-S `)) {
        return line;
      }

      // The data type must be one of the supported varying
      //  data types.  Additionally, the VARYING keyword must
      //  be present.  If both conditions are not met, do nothing.
      if (!/\b(Char|Graph|Ucs2)\(.* VARYING( *\( *\d *\))?[ ;]/i.test(line)) {
        return line;
      }

      // To simplify the regex, we want to force a trailing semicolon.
      //  So, we will remove it if it exists, add one on to the end,
      //   and then when we are all done, put it back (if it was there
      //   to start with).
      let semicolon = ``;
      if (line.substr(-1) === `;`) {
        line = line.slice(0, -1);
        semicolon = `;`;
      }

      // The regex we are using is to break down the line into various
      //  parts that we can reassemble as we see fit.  This includes:
      //  $1  = All text before the data type
      //  $2  = The data type, '(', and length (no trailing ')').
      //  $5  = Spaces after the ending ')' of the data type
      //        Up to 3 leading spaces have been removed from
      //        $5 to account for the added "Var".  If the
      //        varying does not have a length specified, this
      //        will try and preserve the alignment of the keywords.
      //  $6  = Text after the spaces following the data type up to
      //        the VARYING keyword.
      //  $9  = The VARYING length, if specified or undefined
      //  $10 = Text after the VARYING keyword (and optional length)
      //        up to, but not including, the ending semicolon.
      const results = (line + `;`).match(
        /^(.*)( (Char|Graph|Ucs2)\(\d+)(\) {0,4})( *?)(.*)(VARYING( *\( *(\d) *\) *)?)(.*);$/i
      );
      if (results && results.length >= 10) {
        line = (
          results[1] +
          ` Var` +
          results[2].trim().toLowerCase() +
          (results[9] === undefined ? `` : `:` + results[9]) +
          `) ` +
          results[5] +
          results[6] +
          (results[10] === undefined ? `` : results[10].trim())
        ).trimRight();
      }
      return line + semicolon;
    }

    /**
     * Performs additional processing of keywords after they are combined onto one line
     *
     * Because keywords can be placed on multiple lines and even span multiple
     *  lines, it is necessary to perform some additional processing of keywords
     *  once we have merged the multiple lines into a single line.
     */
    function postProcessKeyWords(line = ``, blockType = ``) {
      line = fixVaryingKeyword(line, blockType);
      line = quoteExtNameValue(line, blockType);
      return line;
    }
  }
};
