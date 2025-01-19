export type FirstToUppercase<Str extends string> = Str extends `${infer First}${infer Other}`
  ? `${Uppercase<First>}${Other}`
  : string;

export function firstToUppercase(str: string): string;
export function firstToUppercase<const Str extends string>(str: Str): FirstToUppercase<Str>;

export function firstToUppercase(str: string): string {
  return str[0].toUpperCase() + str.slice(1);
}
