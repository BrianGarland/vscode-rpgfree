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

Highlight all or part of your source code and then right-click and use the "Convert to Free Format" option from the menu.  If no selection was made prior to running "Convert to Free Format", then the entire document will be converted _and_ the `**FREE` will be added as the first line.

> **Note**
> If a selection was made prior to running "Convert to Free Format", the selection will be extended to the start of the first line selected and the end of the last line selected.

## Contributors

* [@worksofliam](https://github.com/worksofliam)
* [@BrianGarland](https://github.com/BrianGarland)
* [@DavidShears](https://github.com/DavidShears)
* [@RoySpino](https://github.com/RoySpino)
