import {t} from '../../json-type/type';
import {createBoolValidator, createStrValidator, createObjValidator, ObjectValidatorError, ObjectValidatorSuccess} from '..';
import {TType} from '../../json-type/types/json';

const exec = (type: TType, json: unknown, error: ObjectValidatorSuccess | ObjectValidatorError) => {
  const fn1 = createBoolValidator(type, {});
  const fn2 = createStrValidator(type, {});
  const fn3 = createObjValidator(type, {skipObjectExtraFieldsCheck: true});

  const result1 = fn1(json);
  const result2 = fn2(json);
  const result3 = fn3(json);

  // console.log(fn1.toString());
  // console.log(fn2.toString());
  // console.log(fn3.toString());

  expect(result1).toBe(!!error);
  expect(result2).toBe(!error ? '' : JSON.stringify([error.code, ...error.path]));
  expect(result3).toBe(error);
};

test('serializes according to schema a POJO object', () => {
  const type = t.Object({
    unknownFields: false,
    fields: [
      t.Field('collection', t.Object({
        unknownFields: false,
        fields: [
          t.Field('id', t.str),
          t.Field('ts', t.num),
          t.Field('cid', t.str),
          t.Field('prid', t.str),
          t.Field('slug', t.str, {isOptional: true}),
          t.Field('name', t.str, {isOptional: true}),
          t.Field('src', t.str, {isOptional: true}),
          t.Field('authz', t.str, {isOptional: true}),
          t.Field('tags', t.Array(t.str)),
        ],
      })),
      t.Field('bin.', t.bin),
    ],
  });

  const json = {
    collection: {
      id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      ts: Date.now(),
      cid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      prid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      slug: 'slug-name',
      name: 'Super collection',
      src: '{"foo": "bar"}',
      // src2: '{"foo": "bar"}',
      authz: 'export const (ctx) => ctx.userId === "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";',
      tags: ['foo', 'bar'],
    },
    'bin.': new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
  };

  exec(type, json, null);
});
