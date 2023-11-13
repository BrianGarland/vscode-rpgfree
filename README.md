# RPG free for Visual Studio Code
Visual Studio Code extension to convert fixed format RPGLE to free format.

This is based on [rpgfreeweb](https://github.com/worksofliam/rpgfreeweb).

## How to get running

### Install from Marketplace

[You can find the extension in the VS Code Marketplace!](https://marketplace.visualstudio.com/items?itemName=BrianJGarland.vscode-rpgfree)

### Run from local

1. clone repo
2. `npm i`
3. `npm run test` to run the converter test suite
4. 'Run Extension' from VS Code debugger for the extension.

## How to use

Two options:
1. Highlight all or part of your source code and then right-click and use the "Convert to Free Format" option from the menu.  A couple of caveats:
    1. Your highlight should start in position 1 of the line or that line will not convert.
    2. Your highlight should end after the end of line for the last line to be converted.
2. Use F1 and choose "Covert to Free Format" to convert the entire source.

## Contributors

* [@worksofliam](https://github.com/worksofliam)
* [@BrianGarland](https://github.com/BrianGarland)
* [@DavidShears](https://github.com/DavidShears)
* [@RoySpino](https://github.com/RoySpino)
* [@stackmystack](https://github.com/stackmystack)

## Development

See [Run from Local](#run-from-local), and make sure you have the following settings for VSCode:

```json
{
    "files.trimTrailingWhitespace": true
}
```

### Known Issues with NodeJS

1. `Error: error:0308010C:digital envelope routines::unsupported`
   The error message would look like:
   ```
   node:internal/crypto/hash:71
   this[kHandle] = new _Hash(algorithm, xofLen);
                   ^

   Error: error:0308010C:digital envelope routines::unsupported
     at new Hash (node:internal/crypto/hash:71:19)
     at Object.createHash (node:crypto:140:10)
     …
   ```
   Which is related to recent NodeJS versions and OpenSSL. It can be fixed by modifying `package.json`:
   ```json
   	"scripts": {
      …
      "webpack": "NODE_OPTIONS=--openssl-legacy-provider webpack --mode development",
      "webpack-dev": "NODE_OPTIONS=--openssl-legacy-provider webpack --mode development --watch",
      …
    }
   ```
