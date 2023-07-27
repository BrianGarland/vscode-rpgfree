       For I = 5 to 7;
         If SOMEVAR = 'O' AND ANOTHERVAR = 'O';
           *In70 = *On;
           I = I + 7;
         Endif;
       Enddo;
                                                                                                    
       For  =  to SOMEVAR;
         *In70 = *Off;
         SOMEVAR = SOMEVAR + 1;
       ENDDO;
                                                                                                    
       Dow *IN99 = *OFF AND SOMEVAR <= 1;
         1 = 1 + SOMEVAR;
       ENDDO;
                                                                                                    
       Dow *IN99 < *OFF AND SOMEVAR <= 1;
         1 = 1 + SOMEVAR;
       ENDDO;
                                                                                                    
       Dow *IN99 > *OFF AND SOMEVAR <= 1;
         1 = 1 + SOMEVAR;
       ENDDO;
