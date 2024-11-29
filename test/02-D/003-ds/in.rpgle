     D PREFDS        E DS                  PREFIX(PRFX)

     D MLTLIN          DS
     D  CHRVAR                83     92
     D  BINVAR               370    371B 0
     D  ZNDOVR                        8  0 overlay(Dtime)

     D dtaarads       UDS                  dtaara(*VAR:DTAARANAME)
     D  fld1                          1A

      // issue 45 embedded comments

      * DSPF0100 HEADER
      * PTR_QDFFINFO = ptrDSPF0100 + Offset_QDFFINFO;
     D QDFFINFO        DS                  QUALIFIED BASED(PTR_QDFFINFO)
     D  Bytesavail                   10I 0
      ** Displacement to the where-used file-level information
     D  Offset_WhrUse                10I 0
     D  LenHdr_WhrUse                10i 0
      * Displacement to the sequence number table defined by structure QDFFSEQT
     D  OfsetQDFFSEQT                10I 0
     D  MaxQDFFSTBLrf                 5U 0
     D  MaxQDFFSTBLr                  5U 0
     D  FileLvlFlg                    2A
     D  Reserved                     12A
      * Displacement to display-file-level device-dependent section
     D  OfsetQDFFINFO                 5U 0
