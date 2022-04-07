import {encode} from '../encode';
import {decode} from '../decode';
import {LogicalClock} from '../../../clock';
import {PatchBuilder} from '../../../PatchBuilder';
import {documents} from '../../../../__tests__/json-documents';

for (const document of documents) {
  (document.only ? test.only : test)(document.name, () => {
    const clock = new LogicalClock(3, 100);
    const builder = new PatchBuilder(clock);
    const jsonId = builder.json(document.json);
    builder.root(jsonId);
    const encoded = encode(builder.patch);
    const decoded = decode(encoded);
    expect(decoded).toEqual(builder.patch);
  });
}
