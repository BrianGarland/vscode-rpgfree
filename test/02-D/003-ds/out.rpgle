       Dcl-DS PREFDS  PREFIX(PRFX);
        End-DS;
       Dcl-DS MLTLIN;
         CHRVAR         Char(10)   Pos(83);
         BINVAR         Bindec(4)  Pos(370);
         ZNDOVR         Zoned(8:0) overlay(Dtime);
        End-DS;
