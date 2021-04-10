import {VectorClock} from '../../../../json-crdt-patch/clock';
import {Document} from '../../../document';
import {Encoder} from '../Encoder';
import {Decoder} from '../Decoder';

test('decodes clock', () => {
  const doc1 = new Document(new VectorClock(222, 0));
  doc1.api.root(123).commit();
  const encoder = new Encoder();
  const decoder = new Decoder();
  const encoded = encoder.encode(doc1);
  const doc2 = decoder.decode(encoded);
  expect(doc2.clock.sessionId).toBe(222);
  expect(doc2.clock.time).toBe(doc1.clock.time);
  expect(doc2.clock.clocks.size).toBe(1);
});

test('decodes all types', () => {
  const doc1 = new Document(new VectorClock(222, 0));
  const json = {
    str: 'asdf',
    arr: [1, 2, 3],
    obj: {foo: 'bar'},
    num: 123.4,
    nil: null,
    bool: [true, false],
  };
  doc1.api.root(json).commit();
  const encoder = new Encoder();
  const decoder = new Decoder();
  const encoded = encoder.encode(doc1);
  const doc2 = decoder.decode(encoded);
  expect(doc1.toJson()).toEqual(json);
  expect(doc2.toJson()).toEqual(json);
});
