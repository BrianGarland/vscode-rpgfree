     C                   If        %error                                                                               
     C                   SETON                                        6062                                              
     C                   ENDIF                                                                                          
                                                                                                                        
     C                   If        %found And Z1_Opt <> *blank                                                          
     C                   SETON                                        60                                                
     C                   ENDIF                                                                                          
                                                                                                                        
     C     VAR0          IFNE      *BLANKS                                                                              
     C     VAR1          ANDNE     '2'                                                                                  
     C                   SETON                                        60                                                
     C                   ENDIF                                                                                          
                                                                                                                        
     C     *IN60         IFEQ      '1'                                                                                  
     C                   SETON                                        3671                                              
     C                   ENDIF                                                                                          
                                                                                                    
     C     *IN03         IFEQ      '1'                                                                                  
     C     *IN12         OREQ      '1'                                                                                  
     C                   SETON                                        31                            
     C                   ENDIF                                                                                          
                                                                                                    
     C     *IN03         IFEQ      '1'                                                                                  
     C     *IN12         ANDEQ     '1'                                                                                  
     C                   SETON                                        31                            
     C                   ENDIF                                                                                          
                                                                                                    
     C     VAR3          IFGT      0                                                                
     C                   SETON                                        31                            
     C                   ENDIF                                                                                          
                                                                                                    
     C     VAR4          IFLT      0                                                                
     C                   SETON                                        31                            
     C                   ENDIF                                                                                          
                                                                                                    
     C     VAR5          IFLT      1                                                                
     C     VAR6          ORLT      1                                                                
     C                   SETON                                        70                            
     C                   ENDIF                                                                                          
