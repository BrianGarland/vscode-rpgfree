// The module `vscode` contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

const RpgleFreeX = require(`./RpgleFree`);

/**
 * This procedure converts the highlighted text to free form
 */
function RpgleFree() {
  const editor = vscode.window.activeTextEditor;
  const eol = editor.document.eol === 1 ? `\n` : `\r\n`;

  // Start with the indent value being a constant
  // We'll add a configuration setting for this in the future
  const indent = 2;

  let curRange;
  let text = ``;

  // Get the selected text from the editor.
  // If nothing is selected, convert the whole document,
  // adding the **FREE as the first line.
  if (editor.selection && !editor.selection.isEmpty) {
    curRange = new vscode.Range(editor.selection.start.line, 0, editor.selection.end.line + 1, 0);
    text = editor.document.getText(curRange);
  }

  if (text === ``) {
    curRange = new vscode.Range(
      editor.document.lineAt(0).range.start,
      editor.document.lineAt(editor.document.lineCount - 1).range.end);
    text = `**FREE${eol}${editor.document.getText()}`;
  }

  // Break the soure lines into an array
  // We add an empty line at the end to flush the parsing
  // of the last block element (e.g., to ensure we add 
  // the `End-DS` for a data structure).  Because we
  // add an extra line, we will need to pop it off
  // before updating the document.
  let lines = text.split(eol);
  lines.push(``);

  // Convert the array of lines to free format
  let conv = new RpgleFreeX(lines, indent);
  conv.parse();

  // As we added an empty line to the array of
  // lines to be converted, the last line _should_ 
  // be blank.  But, before we blindly remove it
  // lets just make sure it truly is empty before
  // we pop it off.
  if (lines.length > 0 && lines[lines.length - 1] === ``) {
    lines.pop();
  }

  // Replace the text
  editor.edit(editBuilder => {
    editBuilder.replace(curRange,lines.join(eol));
  })
  
  vscode.window.showInformationMessage(`Selected text converted to free format`);

  vscode.commands.executeCommand(`editor.action.formatDocument`);
  
}

export function activate(context) {
  
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(`Congratulations, your extension "vscode-rpgfree" is now active!`);

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  context.subscriptions.push(
    vscode.commands.registerCommand(`vscode-rpgfree.rpgleFree`, function () {
      RpgleFree();
    })
  );

}

// this method is called when your extension is deactivated
export function deactivate() {}
