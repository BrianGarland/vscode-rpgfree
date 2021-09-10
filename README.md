# RPG free for Visual Studio Code
Visual Studio Code extension to convert fixed format RPGLE to free format.

This is based on [rpgfreeweb](https://github.com/worksofliam/rpgfreeweb).

## How to get running

### Install from Marketplace

[You can find the extension in the VS Code Marketplace!](https://marketplace.visualstudio.com/items?itemName=BrianJGarland.vscode-rpgfree)

### Run from local

1. clone repo
2. `npm i`
3. 'Run Extension' from vscode debug.

## How to use

Highlight all or part of your source code and then right-click and use the "Convert to Free Format" option from the menu.

A couple of caveats:
1. Your hightlight should start in position 1 of the line or that line will not convert.
2. Your hightlight should end after the end of line for the last line to be converted.

## Contributors

* [@worksofliam](https://github.com/worksofliam)
* [@BrianGarland](https://github.com/BrianGarland)
