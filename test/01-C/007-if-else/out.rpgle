**FREE
If *IN60 = '1';
    *In63 = *On;
    *In44 = *On;
    *In36 = *On;
ELSE;
    If *IN44 = '1';
        *In36 = *On;
    ELSE;
        *In40 = *On;
    Endif;
Endif;

