       Dcl-PR EXTPGMPR0  EXTPGM('EXTPGM0');
        End-PR;
       Dcl-PR EXTPGMPR1  EXTPGM('EXTPGM1');
         Cmd            Char(200)  OPTIONS(*VARSIZE);
         Cmdlen         Packed(15:5) CONST;
        End-PR;
       Dcl-PR SLEEP Uns(10) EXTPROC('sleep');
         SECONDS        Uns(10)    VALUE;
        End-PR;
