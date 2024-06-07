       IF %error;
         *In60 = *On;
         *In62 = *On;
       ENDIF;
                                                                                                                        
       IF %found And Z1_Opt <> *blank;
         *In60 = *On;
       ENDIF;
                                                                                                                        
       If VAR0 <> *BLANKS AND VAR1 <> '2';
         *In60 = *On;
       ENDIF;
                                                                                                                        
       If *IN60 = '1';
         *In36 = *On;
         *In71 = *On;
       ENDIF;
                                                                                                    
       If *IN03 = '1' OR *IN12 = '1';
         *In31 = *On;
       ENDIF;
                                                                                                    
       If *IN03 = '1' AND *IN12 = '1';
         *In31 = *On;
       ENDIF;
                                                                                                    
       If VAR3 > 0;
         *In31 = *On;
       ENDIF;
                                                                                                    
       If VAR4 < 0;
         *In31 = *On;
       ENDIF;
                                                                                                    
       If VAR5 < 1 OR VAR6 < 1;
         *In70 = *On;
       ENDIF;
