import type {Expr, ExprEquals, ExprGet, JsonExpressionCodegenContext, JsonExpressionExecutionContext} from './types';
import {Codegen} from '../util/codegen/Codegen';
import {deepEqual} from '../json-equal/deepEqual';
import {toPath, get as get_} from '../json-pointer';
import {$$deepEqual} from '../json-equal/$$deepEqual';
import {$$find} from '../json-pointer/codegen/find';
import {parseJsonPointer, validateJsonPointer} from '../json-pointer';

const isExpression = (expr: unknown): expr is Expr => (expr instanceof Array) && (typeof expr[0] === 'string');
// const isLiteral = (expr: unknown): boolean => !isExpression(expr);

const get = (path: string, data: unknown) => get_(data, toPath(path));

const linkable = {
  get,
  deepEqual,
};

export type JsonExpressionFn = (ctx: JsonExpressionExecutionContext) => unknown;

/**
 * Represents an expression {@link Expr} which was evaluated by codegen and
 * which value is already know at compilation time, hence it can be emitted
 * as a literal.
 */
class Literal {
  constructor (public val: unknown) {}

  public toString() {
    return JSON.stringify(this.val);
  }
}

/**
 * Represents an expression {@link Expr} which was evaluated by codegen and
 * which value is not yet known at compilation time, hence its value will
 * be evaluated at runtime.
 */
class Expression {
  constructor (public val: string) {}

  public toString() {
    return this.val;
  }
}

type ExpressionResult = Literal | Expression;

export interface JsonExpressionCodegenOptions extends JsonExpressionCodegenContext {
  expression: Expr;
}

export class JsonExpressionCodegen {
  protected codegen: Codegen<JsonExpressionFn>;

  protected linked: {[key: string]: 1} = {};

  public constructor(protected options: JsonExpressionCodegenOptions) {
    this.codegen = new Codegen<JsonExpressionFn>({
      arguments: 'ctx',
      prologue: 'var data = ctx.data;',
      epilogue: '',
    });
  }

  protected link(name: keyof typeof linkable): void {
    if (this.linked[name]) return;
    this.linked[name] = 1;
    this.codegen.linkDependency(linkable[name], name);
  }

  protected onGet(expr: ExprGet): ExpressionResult {
    const path = this.onExpression(expr[1]);
    if (path instanceof Literal) {
      if (typeof path.val !== 'string') throw new Error('Invalid JSON pointer.');
      validateJsonPointer(path.val);
      const fn = $$find(parseJsonPointer(path.val));
      const d = this.codegen.addConstant(fn);
      return new Expression(`${d}(data)`);
    } else {
      this.link('get');
      return new Expression(`get(${path}, data)`);
    }
  }

  protected onEqualsLiteralLiteral(a: unknown, b: unknown): ExpressionResult {
    return new Literal(deepEqual(a, b));
  }

  protected onEqualsLiteralExpression(literal: unknown, expression: Expr): ExpressionResult {
    const expr = this.onExpression(expression);
    if (expr instanceof Literal) return new Literal(deepEqual(literal, expr.val));
    const fn = $$deepEqual(literal);
    const d = this.codegen.addConstant(fn);
    return new Expression(`${d}(${this.onExpression(expression)})`);
  }

  protected onEquals(expr: ExprEquals): ExpressionResult {
    const [, a, b] = expr;
    if (a === undefined || b === undefined)
      throw new Error('Equals operator expects two operands.');
    if (!isExpression(a) && !isExpression(b)) return this.onEqualsLiteralLiteral(a, b);
    if (isExpression(a)) return this.onEqualsLiteralExpression(b, a);
    if (isExpression(b)) return this.onEqualsLiteralExpression(a, b);
    this.link('deepEqual');
    return new Expression(`deepEqual(${this.onExpression(a as Expr)}, ${this.onExpression(b as Expr)})`);
  }

  protected onExpression(expr: Expr | unknown): ExpressionResult {
    if (!isExpression(expr)) {
      if (expr instanceof Array) {
        if (expr.length !== 1 || !(expr[0] instanceof Array))
          throw new Error('Expected array literal to be boxed as single array element.');
        return new Literal(expr[0]);
      } else return new Literal(expr);
    }
    const type = expr[0];
    switch(type) {
      case '=':
      case 'get': return this.onGet(expr as ExprGet);
      case '==':
      case 'eq': return this.onEquals(expr as ExprEquals);
    }
    return new Literal(false);;
  }

  public run(): this {
    const expr = this.onExpression(this.options.expression);
    this.codegen.js(`return ${expr};`);
    return this;
  }

  public generate() {
    return this.codegen.generate();
  }

  public compile() {
    return this.codegen.compile();
  }
}
