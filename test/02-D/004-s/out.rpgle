**FREE
Dcl-S #CHRVAR      Char(3);
Dcl-S CHARVARINI   Char(20)   INZ(*ALL'0');
Dcl-S VARCHARVAR   Varchar(1000);
Dcl-S $INTVAR      Int(5);
Dcl-S $INTINI      Int(5)     INZ(-1);
Dcl-S PCKDVAR      Packed(5:0);
Dcl-S VARZND       Zoned(8:0);
Dcl-S DATVAR       Date;
Dcl-S DATVARISO    Date(*ISO);
Dcl-S TSTMPINI     Timestamp;
Dcl-S TSTMPINI     Timestamp  INZ(Z'1990-01-01-00.00.00.000000');
Dcl-S INDVAR       Ind;
Dcl-S INDVARINI    Ind        INZ(*OFF);
Dcl-S VARLIKE                 LIKE(VARZND);
