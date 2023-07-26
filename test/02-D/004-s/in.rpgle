     D #CHRVAR         S              3                                                                                 
     D CHARVARINI      S             20    INZ(*all'0')                                             
     D VARCHARVAR      S           1000    VARYING                                                  
     D $INTVAR         S              5I 0                                                                              
     D $INTINI         S              5I 0 INZ(-1)                                                                      
     D PCKDVAR         S              5  0                                                                              
     D VARZND          S              8S 0                                                          
     D DATVAR          S               D                                                                                
     D DATVARISO       S               D   DATFMT(*iso)                                             
     D TSTMPINI        S             26Z                                                            
     D TSTMPINI        S             26Z   INZ(Z'1990-01-01-00.00.00.000000')                       
     D INDVAR          S               N                                                            
     D INDVARINI       S               N   inz(*off)                                                
     D VARLIKE         S                   LIKE(VARZND)                                                               
