     C     5             DO        7             I                                                  
     C     SOMEVAR       IFEQ      'O'                                                              
     C     ANOTHERVAR    ANDEQ     'O'                                                              
     C                   SETON                                        70                            
     C                   ADD       7             I                                                  
     C                   END                                                                        
     C                   END                                                                        
                                                                                                    
     C                   DO        SOMEVAR                                                          
     C                   SETOFF                                       70                            
     C                   ADD       1             SOMEVAR                                            
     C                   ENDDO                                                                      
                                                                                                    
     C     *IN99         DOWEQ     *OFF                                                             
     C     SOMEVAR       ANDLE     1                                                                
     C                   ADD       SOMEVAR       I                                                  
     C                   ENDDO                                                                      
                                                                                                    
     C     *IN99         DOWLT     *OFF                                                             
     C     SOMEVAR       ANDLE     1                                                                
     C                   ADD       SOMEVAR       I                                                  
     C                   ENDDO                                                                      
                                                                                                    
     C     *IN99         DOWGT     *OFF                                                             
     C     SOMEVAR       ANDLE     1                                                                
     C                   ADD       SOMEVAR       I                                                  
     C                   ENDDO                                                                      
