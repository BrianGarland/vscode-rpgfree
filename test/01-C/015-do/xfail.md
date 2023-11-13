The input gives this:

```rpgle
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

```

First loop should end with 'Endfor' instead of 'Enddo'

Second loop: we need to make up a new loop counter variable 'For ? = 1 to SOMEVAR'
