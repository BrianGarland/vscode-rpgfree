     D EXTPGMPR0       PR                  EXTPGM('EXTPGM0')                                        
     D EXTPGMPR1       PR                  EXTPGM('EXTPGM1')                                        
     D    Cmd                       200A   OPTIONS(*VARSIZE)                                        
     D    Cmdlen                     15P 5 CONST                                                    
     d SLEEP           PR            10U 0 EXTPROC('sleep')                                         
     d   SECONDS                     10U 0 VALUE                                                    
