# RPG Free for Visual Studio Code

Visual Studio Code extension to convert fixed format RPGLE to free format.

This is based on [rpgfreeweb](https://github.com/BrianGarland/rpgfreeweb) originally written by [@worksofliam](https://github.com/worksofliam).

## How to get running

### Install from Marketplace

[You can find the extension in the VS Code Marketplace!](https://marketplace.visualstudio.com/items?itemName=BrianJGarland.vscode-rpgfree)

### Run from local in debug mode

1. clone repo
2. `npm i`
3. 'Run Extension' from vscode debug (`F5`).

### Build and install your own custom version

1. Clone repo
2. Make changes
3. Use `vsce package`
4. Right-click the vscode-rpgfree-*.vsix file and select _Install Extension VSIX_

## How to use

### Before you convert

Before you convert source, there are some steps you can take to ensure success.

* **Always** make a copy of the original source to ensure you have a reference point and can easily revert if need be.

* Refactor your source, removing op-codes that are not supported in free format.
  * The following op-codes are not supported in free format and must be removed for a successful conversion:
    * `CABxx`
    * `GOTO`
    * `TAG`
    * Labels (Factor 1) on `ENDSR`

* Free format does not support I-specs (input specifications)
  * If your program requires the use of I-specs, you cannot convert to **FREE, but you can conver to free format.
  * If the I-specs are just a carry-over from legacy code, you may be able to refactor your source to remove them prior to conversion.  When doing so, remember that fields defined in I-specs which are not re-defined in a data structure occupy their own memory space ... even if the values overlap the record format.

* In free format file usage declarations must be explicitly set.
  * In traditional syntax, specifying a U in the FIle-Type would all _both_ update and delete operations.  In free format, you must explicitly allow `USAGE(*DELETE)`.

* For auto-data-areas (data area data structures coded with a U), the `IN` and `OUT` operation must be explicitly allowed in free form.
  * The conversion of auto-data-area data structures will correctly add the `*AUTO` option to the `DTAARA` keyword.
  * If the program explicity performs `IN` and/or `OUT` operations, the additional parmater `*USRCTL` must be added to the defintion.
  * For example, change "`Dcl-Ds myDs DtaAra(*AUTO: 'MYDTAARA');`" to "`Dcl-Ds myDs DtaAra(*AUTO: *USRCTL: 'MYDTAARA');`".

* Move definitions of fields from C-specs up to D-specs
  * Free form does not support the ability to define fields "on-the-fly".  All definitions must be explicitly made in the D-specs (or obtained from an external description).
  * During conversion, the data type definition of result fields in the C-specs will be dropped; no attempt will be made to auto-create the D-spec.

* Move `KLIST` and `PLIST` up before their first use.
  * Because _RPGLE Free_ uses a single-pass conversion, all definitions must be seen prior to their first use.

* Refactor any `PLIST` that has `PARM`'s that use Factor 1 (return value) and/or Factor 2 (initial value).
  * _RPGLE Free_ ignores both Factor 1 and Factor 2 of `PARM` definitions.

* Manually convert the use of `MOVE`, `MOVEA`, and `MOVEL`.
  * _RPGLE Free_ does not conver any of the `MOVEx` op-codes.  These must be manually converted.

* Review the Conversion Support of Op-Codes[^Table-1].
  * Take particular note of the op-code support tagged as _Breaking_.
  * As not all op-codes are currently supported, you may want to manually convert any unsupported op-code to free form prior to running the _RPGLE Free_ conversion.

### Convert to free format

Highlight all or part of your source code and then right-click and use the "Convert to Free Format" option from the menu.  If no selection was made prior to running "Convert to Free Format", then the entire document will be converted _and_ the `**FREE` will be added as the first line.

> [!NOTE]
> If a selection was made prior to running "Convert to Free Format", the selection will be extended to the start of the first line selected and the end of the last line selected.

## What is converted

At this time, the _RPGLE Free_ extension will convert H, F, D, C, and P specification types.  While the H, F, D, and P specifications are fully supported, the C specifications are still a work-in-progress.  The following table lists the traditional (fixed format) C spec op-codes and the level of support by the _RPGLE Free_ extension.

> [!WARNING]
> The _RPGLE Free_ extension has the potential to produce code breaking
> results.  The majority of the code breaking conversion centers around
> the use of parameter lists (`PLIST`/`PARM`).  Although, the extension
> will convert parameter lists, there are a couple of very *important*
> restrictions that need to be considered:
>
> * The PLIST definition must be moved up so that the definition
> is converted before the PLIST is used.
>
> * Both Factor 1 (return value) and Factor 2 (initial value) of the
> `PARM` statement are **ignored**.  

> [!IMPORTANT]
> As with parameter lists, key lists (`KLIST`/`KFLD`) also need to
> be moved up in the source to a location before they are first
> used.  While it _should_ go without saying, when converting code
> that uses a key list, be sure to include the key list definition
> in the conversion request (and yes, the same goes for parameter
> lists as well).

## Contributors

* [@worksofliam](https://github.com/worksofliam)
* [@BrianGarland](https://github.com/BrianGarland)
* [@DavidShears](https://github.com/DavidShears)
* [@RoySpino](https://github.com/RoySpino)

[^Table-1]: Conversion Support of Op-Codes

    | Op-Code | Has Free-Form Op-Code | RPGLE Free Support | Conversion Notes |
    | ------- | :-------------------: | ------------------ | ---------------- |
    | ACQ (E) | Y | Full |  |
    | ADD (H) | N | FUll |  |
    | ADDDUR (E) | N | Full |  |
    | ALLOC (E) | N | Full |  |
    | ANDxx | N | Full |  |
    | BEGSR | Y | Full |  |
    | BITOFF | N |  |  |
    | BITON | N |  |  |
    | CABxx | N | n/a |  |
    | CALL (E) | N | Breaking | Attempts to resolve parameter lists; which requires them to be defined _prior_ to being used.<br><br>There is no support in free form for the LR (result indicator 3). |
    | CALLB (E D) | N | Breaking | Attempts to resolve parameter lists; which requires them to be defined _prior_ to being used.<br><br>The operational extender D is not supported by the free form mapping to CALLP.<br><br>There is no support in free form for the LR (result indicator 3). |
    | CALLP (E M/R) | Y | Full |  |
    | CASxx | N | Full |  |
    | CAT (P) | N | None | The CAT operation is too complex to convert to free form.  If conversion were to be done, the following restrictions would need to be made:<br>* The operation extender P=Pad must be used<br>* The variable in the result field cannot have varying length<br>* The optional number of blanks must be a hard-coded number; not a variable. |
    | CHAIN (E N) | Y | Breaking | Attempts to resolve key lists; which requires them to be defined _prior_ to being used. |
    | CHECK (E) | N | Syntax | Does not support the use of an array in the result field. |
    | CHECKR (E) | N | Syntax | Does not support the use of an array in the result field. |
    | CLEAR | Y | Full |  |
    | CLOSE (E) | Y | Full |  |
    | COMMIT (E) | Y | Full |  |
    | COMP | N | Full |  |
    | DATA-GEN | Y | Full |  |
    | DATA-INTO | Y | Full |  |
    | DEALLOC (E/N) | Y | Full |  |
    | DEFINE [like] | N |  |  |
    | DEFINE [dtaara] | N |  |  |
    | DELETE (E) | Y | Breaking | Attempts to resolve key lists; which requires them to be defined _prior_ to being used. |
    | DIV (H) | N | Full |  |
    | DO | N | Breaking | DO/ENDDO blocks are converted to FOR/ENDFOR.  The FOR/ENDFOR loop requires the use of TO or DOWNTO.  Unless the increment value is a hard-coded negative number, the converted source will uses the default TO. |
    | DOU (M/R) | Y | Full |  |
    | DOUxx | N | Full |  |
    | DOW (M/R) | Y | Full |  |
    | DOWxx | N | Full |  |
    | DSPLY (E) | Y | Full |  |
    | DUMP (A) | Y | Full |  |
    | ELSE | Y | Full |  |
    | ELSEIF (M/R) | Y | Full |  |
    | END | N | Full |  |
    | ENDCS | N | Full |  |
    | ENDDO | Y | Full |  |
    | ENDFOR | Y | Full |  |
    | ENDIF | Y | Full |  |
    | ENDMON | Y | Full |  |
    | ENDSL | Y | Full |  |
    | ENDSR | Y | Breaking | Labels in Factor 1 are not supported in free format and will be ignored. |
    | EVAL (H M/R) | Y | Full |  |
    | EVAL-CORR | Y | Full |  |
    | EVALR (M/R) | Y | Full |  |
    | EXCEPT | Y | Full |  |
    | EXFMT (E) | Y | Full |  |
    | EXSR | Y | Full |  |
    | EXTRCT (E) | N |  |  |
    | FEOD (E N) | Y | Full |  |
    | FOR | Y | Full |  |
    | FORCE | Y | Full |  |
    | GOTO | N | n/a |  |
    | IF (M/R) | Y | Full |  |
    | IFxx | N | Full |  |
    | IN (E) | Y | Full |  |
    | ITER | Y | Full |  |
    | KFLD | N | Breaking | Keylists are built as conversion is done.  If keylists are defined after they are used, the keylist will not be replaced properly.<br><br>Field definitions on the KFLD are dropped.  It is epxected that the fields will be properly defined in a D spec prior to running conversion. |
    | KLIST | N | Breaking | Keylists are built as conversion is done.  If keylists are defined after they are used, the keylist will not be replaced properly.<br><br>Field definitions on the KFLD are dropped.  It is epxected that the fields will be properly defined in a D spec prior to running conversion. |
    | LEAVE | Y | Full |  |
    | LEAVESR | Y | Full |  |
    | LOOKUP [array] | N | Full |  |
    | LOOKUP [table] | N | Full |  |
    | MHHZO | N |  | Use %BitAnd() and %BitOr(). |
    | MHLZO | N |  | Use %BitAnd() and %BitOr(). |
    | MLHZO | N |  | Use %BitAnd() and %BitOr(). |
    | MLLZO | N |  | Use %BitAnd() and %BitOr(). |
    | MONITOR | Y | Full |  |
    | MOVE (P) | N | None |  |
    | MOVEA (P) | N |  |  |
    | MOVEL (P) | N | None |  |
    | MULT (H) | N | Full |  |
    | MVR | N |  |  |
    | NEXT (E) | Y | Full |  |
    | OCCUR (E) | N |  |  |
    | ON-ERROR | Y | Full |  |
    | ON-EXCP | Y | Full |  |
    | ON-EXIT | Y | Full |  |
    | OPEN (E) | Y | Full |  |
    | ORxx | N | Full |  |
    | OTHER | Y | Full |  |
    | OUT (E) | Y | Full |  |
    | PARM | N | Breaking | Parameter lists are built as conversion is done.  If parameter lists are defined after they are used, the list will not be replaced properly.<br><br>Field definitions on the PARM are dropped.  It is epxected that the fields will be properly defined in a D spec prior to running conversion.<br><br>Factor1 (return value) and Factor2 (initial value) are ignored. |
    | PLIST | N | Breaking | Parameter lists are built as conversion is done.  If parameter lists are defined after they are used, the list will not be replaced properly.<br><br>Field definitions on the PARM are dropped.  It is epxected that the fields will be properly defined in a D spec prior to running conversion.<br><br>Factor1 (return value) and Factor2 (initial value) are ignored. |
    | POST (E) | Y | Syntax | Free form does not support the INFDS data structure in the result field. |
    | READ (E N) | Y | Full |  |
    | READC (E) | Y | Full |  |
    | READE (E N) | Y | Breaking | Attempts to resolve key lists; which requires them to be defined _prior_ to being used. |
    | READP (E N) | Y | Full |  |
    | READPE (E N) | Y | Breaking | Attempts to resolve key lists; which requires them to be defined _prior_ to being used. |
    | REALLOC (E) | N | Full |  |
    | REL (E) | Y | Full |  |
    | RESET (E) | Y | Full |  |
    | RETURN (H M/R) | Y | Full |  |
    | ROLBK (E) | Y | Full |  |
    | SCAN (E) | N | Full |  |
    | SELECT | Y | Full |  |
    | SETGT (E) | Y | Breaking | Attempts to resolve key lists; which requires them to be defined _prior_ to being used. |
    | SETLL (E) | Y | Breaking | Attempts to resolve key lists; which requires them to be defined _prior_ to being used. |
    | SETOFF | N | Full |  |
    | SETON | N | Full |  |
    | SHTDN | N | Full |  |
    | SORTA (A/D) | Y | Full |  |
    | SQRT (H) | N | Full |  |
    | SUB (H) | N | Full |  |
    | SUBDUR (E) [duration] | N | Full |  |
    | SUBDUR (E) [new date] | N | Full |  |
    | SUBST (E P) | N | Partial/Breaking | The SUBST operation will only be converted if the P=Pad operation extender was specified.<br><br>In traditional syntax, if the result field is varying length, the SUBST op-code does not change the length of the string.  However, in the free form format, the EVAL statement will potentially (likely) change the length of the variable. |
    | TAG | N | n/a |  |
    | TEST (E D) [char date] | Y |  |  |
    | TEST (E T) [char time] | Y |  |  |
    | TEST (E Z) [char tms] | Y |  |  |
    | TEST (E) [date/time/tms] | Y |  |  |
    | TESTB | N |  |  |
    | TESTN | N |  |  |
    | TESTZ | N |  |  |
    | TIME | N | Breaking | The conversion of TIME to free form will always convert to %Time().  Based on the result variable definition, the correct BIF might be %Date(), %Time(), or %Timestamp(). |
    | UNLOCK (E) | Y | Full |  |
    | UPDATE (E) | Y | Full |  |
    | WHEN (M/R) | Y | Full |  |
    | WHENxx | N | Full |  |
    | WHEN-IN | Y | Full |  |
    | WHEN-IS | Y | Full |  |
    | WRITE (E) | Y | Full |  |
    | XFOOT (H) | N | Full |  |
    | XLATE (E P) | N | Partial | The XLATE operation will only be converted if the P=Pad operation extender was specified. |
    | XML-INTO | Y | Full |  |
    | XML-SAX (E) | Y | Full |  |
    | Z-ADD (H) | N | Full |  |
    | Z-SUB (H) | N | Full |  |
