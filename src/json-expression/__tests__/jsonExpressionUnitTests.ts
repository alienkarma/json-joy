import {Expr, JsonExpressionCodegenContext} from '../types';

export type Check = (
  expression: Expr,
  expected: unknown,
  data?: unknown,
  options?: JsonExpressionCodegenContext,
) => void;

export const jsonExpressionUnitTests = (
  check: Check,
  {skipOperandArityTests}: {skipOperandArityTests?: boolean} = {},
) => {
  describe('Arithmetic operators', () => {
    describe('add or +', () => {
      test('can add numbers', () => {
        check(['add', 1, 2], 3);
        check(['+', 1, 2], 3);
      });

      test('evaluates sub-expressions', () => {
        check(['add', 1, ['add', 1, 1]], 3);
        check(['+', 1, ['+', 1, 1]], 3);
      });

      test('is variadic', () => {
        check(['add', 1, 1, 1, 1], 4);
        check(['+', 1, 2, 3, 4], 10);
      });

      test('casts strings to numbers', () => {
        check(['add', '2', '2'], 4);
        check(['+', '1', '10.5'], 11.5);
      });

      test('throws on too few arguments', () => {
        expect(() => check(['add', 1], 2)).toThrowErrorMatchingInlineSnapshot(
          `""+" operator expects at least two operands."`,
        );
        expect(() => check(['+', 1], 2)).toThrowErrorMatchingInlineSnapshot(
          `""+" operator expects at least two operands."`,
        );
      });
    });

    describe('subtract or -', () => {
      test('two operands', () => {
        check(['subtract', 1, 2], -1);
        check(['-', 1, 2], -1);
      });

      test('evaluates sub-expressions', () => {
        check(['subtract', 1, ['subtract', 1, 1]], 1);
        check(['-', 1, ['-', 1, 1]], 1);
      });

      test('is variadic', () => {
        check(['subtract', 1, 1, 1, 1], -2);
        check(['-', 1, 2, 3, 4], -8);
      });

      test('casts strings to numbers', () => {
        check(['subtract', '2', '2'], 0);
        check(['-', '1', '10.5'], -9.5);
      });

      test('throws on too few arguments', () => {
        expect(() => check(['subtract', 1], 2)).toThrowErrorMatchingInlineSnapshot(
          `""-" operator expects at least two operands."`,
        );
        expect(() => check(['-', 1], 2)).toThrowErrorMatchingInlineSnapshot(
          `""-" operator expects at least two operands."`,
        );
      });
    });

    describe('multiply or *', () => {
      test('two operands', () => {
        check(['multiply', 1, 2], 2);
        check(['*', 3, 2], 6);
      });

      test('evaluates sub-expressions', () => {
        check(['multiply', 1, ['multiply', 1, 1]], 1);
        check(['*', 0.5, ['*', 4, 4]], 8);
      });

      test('is variadic', () => {
        check(['multiply', 2, 2, 2, 2], 16);
        check(['*', 1, 2, 3, 4], 24);
      });

      test('casts strings to numbers', () => {
        check(['multiply', '2', '2'], 4);
        check(['*', '1', '10.5'], 10.5);
      });

      test('throws on too few arguments', () => {
        expect(() => check(['multiply', 1], 2)).toThrowErrorMatchingInlineSnapshot(
          `""*" operator expects at least two operands."`,
        );
        expect(() => check(['*', 1], 2)).toThrowErrorMatchingInlineSnapshot(
          `""*" operator expects at least two operands."`,
        );
      });
    });

    describe('divide or /', () => {
      test('two operands', () => {
        check(['divide', 1, 2], 0.5);
        check(['/', 3, 2], 1.5);
      });

      test('evaluates sub-expressions', () => {
        check(['divide', 1, ['divide', 4, 2]], 0.5);
        check(['/', 0.5, ['/', 4, 4]], 0.5);
      });

      test('is variadic', () => {
        check(['divide', 2, 2, 2, 2], 0.25);
        check(['/', 32, 2, 4, ['+', 1, 1]], 2);
      });

      test('casts strings to numbers', () => {
        check(['divide', '4', '2'], 2);
        check(['/', '1', '10'], 0.1);
      });

      test('throws on too few arguments', () => {
        expect(() => check(['divide', 1], 2)).toThrowErrorMatchingInlineSnapshot(
          `""/" operator expects at least two operands."`,
        );
        expect(() => check(['/', 1], 2)).toThrowErrorMatchingInlineSnapshot(
          `""/" operator expects at least two operands."`,
        );
      });

      test('throws throws when dividing by zero', () => {
        expect(() => check(['divide', 1, 0], 0)).toThrowErrorMatchingInlineSnapshot(`"DIVISION_BY_ZERO"`);
        expect(() => check(['/', ['+', 1, 1], 0], 0)).toThrowErrorMatchingInlineSnapshot(`"DIVISION_BY_ZERO"`);
      });
    });

    describe('divide or %', () => {
      test('two operands', () => {
        check(['mod', 1, 2], 1);
        check(['%', 3, 2], 1);
      });

      test('evaluates sub-expressions', () => {
        check(['mod', 3, ['mod', 4, 3]], 0);
        check(['%', 5, ['%', 7, 5]], 1);
      });

      test('is variadic', () => {
        check(['mod', 13, 7, 4, 2], 0);
        check(['%', 32, 25, 4, ['%', 5, 3]], 1);
      });

      test('casts strings to numbers', () => {
        check(['mod', '4', '2'], 0);
        check(['%', '1', '10'], 1);
      });

      test('throws on too few arguments', () => {
        expect(() => check(['mod', 1], 2)).toThrowErrorMatchingInlineSnapshot(
          `""%" operator expects at least two operands."`,
        );
        expect(() => check(['%', 1], 2)).toThrowErrorMatchingInlineSnapshot(
          `""%" operator expects at least two operands."`,
        );
      });

      test('throws throws when dividing by zero', () => {
        expect(() => check(['mod', 1, 0], 0)).toThrowErrorMatchingInlineSnapshot(`"DIVISION_BY_ZERO"`);
        expect(() => check(['%', ['+', 1, 1], 0], 0)).toThrowErrorMatchingInlineSnapshot(`"DIVISION_BY_ZERO"`);
      });
    });

    describe('min', () => {
      test('two operands', () => {
        check(['min', 1, 2], 1);
      });

      test('evaluates sub-expressions', () => {
        check(['min', 5, ['min', 4, 3]], 3);
      });

      test('is variadic', () => {
        check(['min', 13, 7, 4, 2], 2);
      });

      test('casts strings to numbers', () => {
        check(['min', '4', '2'], 2);
      });
    });

    describe('max', () => {
      test('two operands', () => {
        check(['max', 1, 2], 2);
      });

      test('evaluates sub-expressions', () => {
        check(['max', 5, ['max', 4, 3]], 5);
      });

      test('is variadic', () => {
        check(['max', 13, 7, 4, 2], 13);
      });

      test('casts strings to numbers', () => {
        check(['max', '4', '2'], 4);
      });
    });

    describe('round', () => {
      test('can round', () => {
        check(['round', 1.6], 2);
        check(['round', 3], 3);
      });

      test('evaluates sub-expressions', () => {
        check(['round', ['round', 5.8]], 6);
      });

      test('throws on too few arguments', () => {
        expect(() => check(['round'] as any, 2)).toThrowErrorMatchingInlineSnapshot(
          `""round" operator expects 1 operands."`,
        );
        expect(() => check(['round', 1, 2] as any, 2)).toThrowErrorMatchingInlineSnapshot(
          `""round" operator expects 1 operands."`,
        );
      });
    });

    describe('ceil', () => {
      test('can round', () => {
        check(['ceil', 1.6], 2);
        check(['ceil', 1.2], 2);
        check(['ceil', 3], 3);
      });

      test('evaluates sub-expressions', () => {
        check(['ceil', ['ceil', 5.8]], 6);
      });

      test('throws on too few arguments', () => {
        expect(() => check(['ceil'] as any, 2)).toThrowErrorMatchingInlineSnapshot(
          `""ceil" operator expects 1 operands."`,
        );
        expect(() => check(['ceil', 1, 2] as any, 2)).toThrowErrorMatchingInlineSnapshot(
          `""ceil" operator expects 1 operands."`,
        );
      });
    });

    describe('floor', () => {
      test('can round', () => {
        check(['floor', 1.6], 1);
        check(['floor', 1.2], 1);
        check(['floor', 3], 3);
      });

      test('evaluates sub-expressions', () => {
        check(['floor', ['floor', 5.8]], 5);
      });

      test('throws on too few arguments', () => {
        expect(() => check(['floor'] as any, 2)).toThrowErrorMatchingInlineSnapshot(
          `""floor" operator expects 1 operands."`,
        );
        expect(() => check(['floor', 1, 2] as any, 2)).toThrowErrorMatchingInlineSnapshot(
          `""floor" operator expects 1 operands."`,
        );
      });
    });

    describe('abs', () => {
      test('returns positive value', () => {
        check(['abs', ['+', 0, 1.6]], 1.6);
        check(['abs', ['+', 0, -1.2]], 1.2);
        check(['abs', ['+', 0, -3]], 3);
        check(['abs', ['+', 0, 5]], 5);
      });

      test('evaluates sub-expressions', () => {
        check(['abs', ['abs', -5.8]], 5.8);
      });

      test('throws on too few arguments', () => {
        expect(() => check(['abs'] as any, 2)).toThrowErrorMatchingInlineSnapshot(
          `""abs" operator expects 1 operands."`,
        );
        expect(() => check(['abs', 1, 2] as any, 2)).toThrowErrorMatchingInlineSnapshot(
          `""abs" operator expects 1 operands."`,
        );
      });
    });

    describe('sqrt', () => {
      test('returns the root', () => {
        check(['sqrt', ['+', 0, 9]], 3);
        check(['sqrt', 16], 4);
        check(['sqrt', ['+', 0, 1]], 1);
      });

      test('evaluates sub-expressions', () => {
        check(['sqrt', ['sqrt', 81]], 3);
      });

      test('throws on too few arguments', () => {
        expect(() => check(['sqrt'] as any, 2)).toThrowErrorMatchingInlineSnapshot(
          `""sqrt" operator expects 1 operands."`,
        );
        expect(() => check(['sqrt', 1, 2] as any, 2)).toThrowErrorMatchingInlineSnapshot(
          `""sqrt" operator expects 1 operands."`,
        );
      });
    });

    describe('exp', () => {
      test('returns exponent', () => {
        check(['exp', ['+', 0, 2]], Math.exp(2));
        check(['exp', 3], Math.exp(3));
        check(['exp', ['+', 0, 4.4]], Math.exp(4.4));
      });

      test('evaluates sub-expressions', () => {
        check(['exp', ['exp', 2]], Math.exp(Math.exp(2)));
      });

      test('throws on too few arguments', () => {
        expect(() => check(['exp'] as any, 2)).toThrowErrorMatchingInlineSnapshot(
          `""exp" operator expects 1 operands."`,
        );
        expect(() => check(['exp', 1, 2] as any, 2)).toThrowErrorMatchingInlineSnapshot(
          `""exp" operator expects 1 operands."`,
        );
      });
    });
  });
};
