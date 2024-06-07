SELECT;
  WHEN VAR01 = '5' And VAR02 < '100';
    *In60 = *On;
ENDSL;
                                                                                                                
SELECT;
  WHEN VAR01 = '5' And VAR02 < '100';
    *In60 = *On;
  WHEN VAR01 = '8' And VAR02 <> '000';
    *In61 = *On;
  WHEN VAR01 = '9' And VAR02 <> '100';
    *In62 = *On;
ENDSL;
                                                                                                                
SELECT;
  WHEN VAR01 = '5' And VAR02 < '100';
    *In60 = *On;
  WHEN VAR01 = '8' And VAR02 <> '000';
    *In61 = *On;
  OTHER;
    *In62 = *On;
ENDSL;
                                                                                                                
SELECT;
  When VAR01 = '1';
    *In60 = *On;
  When VAR01 < '1';
    *In61 = *On;
  When VAR01 > '1';
    *In62 = *On;
  OTHER;
    *In63 = *On;
ENDSL;
