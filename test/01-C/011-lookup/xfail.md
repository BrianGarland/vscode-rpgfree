The converter produces this:

```rpgle
       *In45 = (%Lookup(VAL:ARRVAR:IDX) > 0);
```

But this is plain wrong, since the definition of `%LOOKUPxx` is:

```
%LOOKUP(arg : array | keyed_array_DS {: start_index {: number_of_elements}})
%LOOKUPLT(arg : array {: start_index {: number_of_elements}})
%LOOKUPGE(arg : array {: start_index {: number_of_elements}})
%LOOKUPGT(arg : array {: start_index {: number_of_elements}})
%LOOKUPLE(arg : array {: start_index {: number_of_elements}})
```

I think this is fine but need to reseach to confirm.