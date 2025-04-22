// these properties are for TS type narrowing: without this, when
// token is Implicit, if !token.is(Whitespace) then token becomes never. To
// say, type `this is SomeType` cannot differentiate Whitespace, LineBreak,
// etc, as they have same shape, even though `instanceof` will say different.
export type TypeMarker = never;
