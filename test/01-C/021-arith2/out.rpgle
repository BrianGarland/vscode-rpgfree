       SOMEVAR0 = SOMEVAR0 + 1;
       SOMEVAR0 = SOMEVAR0 + SOMEVAR1;
       SOMEVAR0 = SOMEVAR2 + SOMEVAR1;

       SOMEVAR0 = SOMEVAR0 / 1;
       SOMEVAR0 = SOMEVAR0 / SOMEVAR1;
       SOMEVAR0 = SOMEVAR2 / SOMEVAR1;

       SOMEVAR0 = SOMEVAR0 * 1;
       SOMEVAR0 = SOMEVAR0 * SOMEVAR1;
       SOMEVAR0 = SOMEVAR2 * SOMEVAR1;

       SOMEVAR0 = SOMEVAR0 - 1;
       SOMEVAR0 = SOMEVAR0 - SOMEVAR1;
       SOMEVAR0 = SOMEVAR2 - SOMEVAR1;

       SOMEVAR = %SQRT(2);
       SOMEVAR = %SQRT(SOMEVAR);

       SOMEVAR = 1;

       SOMEVAR = -1;

       EVAL(H) DEDAMT = PCT(XIDX) * DDAMT#;

       EVAL(H) DEDAMT = PCT(XIDX) / DDAMT#;

       EVAL(H) DEDAMT = PCT(XIDX) + DDAMT#;

       EVAL(H) DEDAMT = PCT(XIDX) - DDAMT#;

       EVAL(H) NODEC = DDAMT#;

       EVAL(H) NODEC = -DDAMT#;

       EVAL(H) NODEC = %SQRT(DDAMT#);
