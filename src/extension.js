// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

const RpgleFreeX = require(`./RpgleFree`);

/**
 * This procedure converts the highlighted text to free form
 */
function RpgleFree() {

  const editor = vscode.window.activeTextEditor;
  const eol = editor.document.eol === 1 ? '\n' : '\r\n';

  // Get the selected text from the editor
  let curRange = new vscode.Range(editor.selection.start, editor.selection.end);
  let text = editor.document.getText(editor.selection);

  // If no text select, then use the full document
  if (text == '') {
    const fullText = editor.document.getText();
    curRange = new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(fullText.length - 1));
    // If converting everything we should add **FREE to the start
    text = '**FREE' + eol + editor.document.getText();
  };

  // Break into an array
  let lines = text.split(eol);

  // Start with the indent value being a constant
  // We'll add a configuration setting for this in the future
  const indent = 2;

  // Convert the array of lines to free format
  let conv = new RpgleFreeX(lines, indent);
  conv.parse();

  // Replace the text
  editor.edit(editBuilder => {
    editBuilder.replace(curRange,lines.join(eol));
  })

  vscode.window.showInformationMessage(`Selected text converted to free format`);

  vscode.commands.executeCommand('editor.action.formatDocument');

}

export function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-rpgfree" is now active!');

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
