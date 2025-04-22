### Note

The problem of current implementation is: there is no clear distinction between
CstParseContextImpl and CstIntermediateGroup. These two both implements some
kind of parsing, but there are scattered around code.

What should CstParseContextImpl do? Well, it's parsing.
What should CstIntermediateGroup do? It should be a mutable container for saving
all internal stuff by parse context. It should also manage its internal state
for ideal parsing.
