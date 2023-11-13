       For I = 5 to 7;
         If SOMEVAR = 'O' AND ANOTHERVAR = 'O';
           *In70 = *On;
           I = I + 7;
         Endif;
       Endfor;
                                                                                                    
       For ?  = 1 to SOMEVAR;
         *In70 = *Off;
         SOMEVAR = SOMEVAR + 1;
       ENDDO;
                                                                                                    
       Dow *IN99 = *OFF AND SOMEVAR <= 1;
         I = I + SOMEVAR;
       ENDDO;
                                                                                                    
       Dow *IN99 < *OFF AND SOMEVAR <= 1;
         I = I + SOMEVAR;
       ENDDO;
                                                                                                    
       Dow *IN99 > *OFF AND SOMEVAR <= 1;
         I = I + SOMEVAR;
       ENDDO;
