import {deepEqual} from "../json-equal/deepEqual";
import {findByPointer} from "../json-pointer";
import {Expr, JsonExpressionCodegenContext, JsonExpressionExecutionContext} from "./types";
import {contains, ends, starts, str, type} from "./util";

const toNumber = (value: unknown): number => +(value as number) || 0;

export const evaluate = (expr: Expr | unknown, ctx: JsonExpressionExecutionContext & JsonExpressionCodegenContext): any => {
  if (!(expr instanceof Array)) return expr;
  if (expr.length === 1 && expr[0] instanceof Array) return expr[0];

  const fn = expr[0];

  switch (fn) {
    case '=':
    case '<-':
    case 'get': {
      const value = evaluate(expr[1], ctx);
      return findByPointer(String(value), ctx.data).val;
    }
    case '==':
    case 'eq': {
      const left = evaluate(expr[1], ctx);
      const right = evaluate(expr[2], ctx);
      return deepEqual(left, right);
    }
    case 'in': {
      const v2 = evaluate(expr[2], ctx);
      if (!(v2 instanceof Array) || !v2.length) return false;
      const v1 = evaluate(expr[1], ctx);
      return v2.some((item: unknown) => deepEqual(item, v1));
    }
    case '!=':
    case 'ne': {
      const left = evaluate(expr[1], ctx);
      const right = evaluate(expr[2], ctx);
      return !deepEqual(left, right);
    }
    case '?':
    case 'if': {
      return evaluate(expr[1], ctx) ? evaluate(expr[2], ctx) : evaluate(expr[3], ctx);
    }
    case '&&':
    case 'and':
      return expr.slice(1).every(e => evaluate(e, ctx));
    case '||':
    case 'or':
      return expr.slice(1).some(e => evaluate(e, ctx));
    case '!':
    case 'not':
      return !evaluate(expr[1], ctx);
    case 'type': return type(evaluate(expr[1], ctx));
    case 'defined': {
      const pointer = evaluate(expr[1], ctx);
      const value = findByPointer(String(pointer), ctx.data).val;
      return value !== undefined;
    }
    case 'bool': return !!evaluate(expr[1], ctx);
    case 'num': return toNumber(evaluate(expr[1], ctx));
    case 'int': return ~~evaluate(expr[1], ctx);
    case 'str': return str(evaluate(expr[1], ctx));
    case 'starts': {
      const inner = evaluate(expr[1], ctx);
      const outer = evaluate(expr[2], ctx);
      return starts(outer, inner);
    }
    case 'contains': {
      const inner = evaluate(expr[1], ctx);
      const outer = evaluate(expr[2], ctx);
      return contains(outer, inner);
    }
    case 'ends': {
      const inner = str(evaluate(expr[1], ctx));
      const outer = str(evaluate(expr[2], ctx));
      return ends(outer, inner);
    }
    case 'cat':
    case '.': {
      return expr.slice(1).map(e => evaluate(e, ctx)).join('');
    }
    case 'substr': {
      const str2 = str(evaluate(expr[1], ctx));
      const start = toNumber(evaluate(expr[2], ctx));
      const end = expr.length > 3 ? toNumber(evaluate(expr[3], ctx)) : undefined;
      return str2.substr(start, end);
    }
    case '<': {
      const left = toNumber(evaluate(expr[1], ctx));
      const right = toNumber(evaluate(expr[2], ctx));
      return left < right;
    }
    case '<=': {
      const left = toNumber(evaluate(expr[1], ctx));
      const right = toNumber(evaluate(expr[2], ctx));
      return left <= right;
    }
    case '>': {
      const left = toNumber(evaluate(expr[1], ctx));
      const right = toNumber(evaluate(expr[2], ctx));
      return left > right;
    }
    case '>=': {
      const left = toNumber(evaluate(expr[1], ctx));
      const right = toNumber(evaluate(expr[2], ctx));
      return left >= right;
    }
    case 'min': {
      return Math.min(...expr.slice(1).map(e => toNumber(evaluate(e, ctx))));
    }
    case 'max': {
      return Math.max(...expr.slice(1).map(e => toNumber(evaluate(e, ctx))));
    }
    case '+': {
      return expr.slice(1).reduce((acc, e) => toNumber(evaluate(e, ctx)) + acc, 0);
    }
    case '-': {
      return expr.slice(2).reduce((acc, e) => acc - toNumber(evaluate(e, ctx)), expr[1]);
    }
    case '*': {
      return expr.slice(2).reduce((acc, e) => toNumber(evaluate(e, ctx)) * acc, expr[1]);
    }
    case '/': {
      return evaluate(expr[1], ctx) / evaluate(expr[2], ctx);
    }
    case '%': {
      return evaluate(expr[1], ctx) % evaluate(expr[2], ctx);
    }
  }

  throw new Error('Unknown expression.');
};
