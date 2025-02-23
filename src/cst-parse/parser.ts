import { yellow } from "../utils/colors.ts";
import type { CstNode } from "../cst/CstNode.ts";
import type { CstNodeInfo } from "../cst/CstNodeInfo.ts";
import { node, nullableNode } from "./inlineNode.ts";
import { type CstParseContext, withContext } from "./CstParseContext.ts";
import { ParseError } from "./parseError.ts";

abstract class CstParserClass<Node extends CstNode, Fn extends (...args: any[]) => any> {
  abstract info: CstNodeInfo<Node>;

  abstract invoke(...args: Parameters<Fn>): ReturnType<Fn>;

  protected abstract surround(inner: () => ReturnType<Fn>): ReturnType<Fn>;
  abstract invokeRaw(...args: Parameters<Fn>): ReturnType<Fn>;

  invokeWith(
    context: CstParseContext,
    ...args: Parameters<Fn>
  ): ReturnType<Fn> {
    return withContext(context, () => this.invoke(...args));
  }

  invokeWithInside(
    extra: (fn: () => ReturnType<Fn>) => ReturnType<Fn>,
    ...args: Parameters<Fn>
  ): ReturnType<Fn> {
    return this.surround(() => extra(() => this.invokeRaw(...args)));
  }

  nonNull(...args: Parameters<Fn>): NonNullable<ReturnType<Fn>> {
    // todo: remove nullable flag
    const node = this.invoke(...args);
    if (node === null || node === undefined) {
      throw new ParseError("result is null");
    }
    return node;
  }
}

export const CstParser = CstParserClass;
export type CstParser<Node extends CstNode, Fn extends (...args: any) => any> =
  & CstParserClass<Node, Fn>
  & Fn;

function parserName(option: string | undefined, info: CstNodeInfo<any>): string {
  const extractName = () => {
    const name = info.name;
    if (!name.length) return "";
    return name[0].toLowerCase() + name.slice(1);
  };
  return yellow(option ?? extractName());
}

export function rawParser<Params extends any[], Node extends CstNode, R>(
  info: CstNodeInfo<Node>,
  surround: (result: () => R) => R,
  raw: (...args: Params) => R,
  impl: (...args: Params) => R = (...args: Params): R => surround(() => raw(...args)),
): CstParser<Node, ((...args: Params) => R)> {
  const parser = new class extends CstParser<Node, ((...args: Params) => R)> {
    override info = info;
    override invoke = impl;
    override invokeRaw = raw;
    override surround = surround;
  }();
  return Object.setPrototypeOf(Object.assign(impl, parser), Object.getPrototypeOf(parser));
}

export function parser<Params extends any[], Node extends CstNode>(
  info: CstNodeInfo<Node>,
  impl: (...args: Params) => Node,
  options?: { name?: string },
): CstParser<Node, ((...args: Params) => Node)> {
  Object.defineProperty(impl, "name", { value: parserName(options?.name, info) });
  return rawParser(
    info,
    (inner) => node(info, inner),
    impl,
    (...args) => node(info, () => impl(...args)),
  );
}

export function nullableParser<Params extends any[], Node extends CstNode>(
  info: CstNodeInfo<Node>,
  impl: (...args: Params) => Node | null,
  options?: { name?: string },
): CstParser<Node, ((...args: Params) => Node | null)> {
  Object.defineProperty(impl, "name", { value: parserName(options?.name, info) });
  return rawParser(
    info,
    (inner) => nullableNode(info, inner),
    impl,
    (...args) => nullableNode(info, () => impl(...args)),
  );
}
