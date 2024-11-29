       Dcl-DS PREFDS  PREFIX(PRFX);
        End-DS;

       Dcl-DS MLTLIN;
         CHRVAR         Char(10)   Pos(83);
         BINVAR         Bindec(4)  Pos(370);
         ZNDOVR         Zoned(8:0) OVERLAY(DTIME);
        End-DS;

       Dcl-DS dtaarads  DTAARA(*VAR:DTAARANAME);
         fld1           Char(1);
        End-DS;

       // issue 45 embedded comments

        // DSPF0100 HEADER
        // PTR_QDFFINFO = ptrDSPF0100 + Offset_QDFFINFO;
       Dcl-DS QDFFINFO  QUALIFIED BASED(PTR_QDFFINFO);
         Bytesavail     Int(10);
          //* Displacement to the where-used file-level information
         Offset_WhrUse  Int(10);
         LenHdr_WhrUse  Int(10);
          // Displacement to the sequence number table defined by structure QDFFSEQT
         OfsetQDFFSEQT  Int(10);
         MaxQDFFSTBLrf  Uns(5);
         MaxQDFFSTBLr   Uns(5);
         FileLvlFlg     Char(2);
         Reserved       Char(12);
          // Displacement to display-file-level device-dependent section
         OfsetQDFFINFO  Uns(5);
        End-DS;
