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

It's obvious that the second form is screwed.
I picked it from a private example I have, maybe I'm missing context?
