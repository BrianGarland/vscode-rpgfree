Dcl-F IFDISK Usage(*Input) Keyed;
Dcl-F IFDISKREN Usage(*Input) Keyed RENAME(FLD1:FLD2);
Dcl-F IFDISKPRE Usage(*Input) Keyed PREFIX(PRFX);
Dcl-F SPOFIL2 Usage(*Input) Keyed PREFIX(PRFX)  INFDS(SOMEFDS);
Dcl-F UFDISKE Usage(*Update:*Delete:*Output) Keyed;
Dcl-F UFDISKAE Usage(*Update:*Delete:*Output) Keyed;
Dcl-F UFDISKAERP Usage(*Update:*Delete:*Output) Keyed RENAME(FLD1:FLD2) PREFIX(PRFX);
