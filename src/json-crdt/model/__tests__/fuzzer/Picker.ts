import {UNDEFINED_ID} from '../../../../json-crdt-patch/constants';
import {DeleteOperation} from '../../../../json-crdt-patch/operations/DeleteOperation';
import {InsertArrayElementsOperation} from '../../../../json-crdt-patch/operations/InsertArrayElementsOperation';
import {InsertStringSubstringOperation} from '../../../../json-crdt-patch/operations/InsertStringSubstringOperation';
import {SetObjectKeysOperation} from '../../../../json-crdt-patch/operations/SetObjectKeysOperation';
import {JsonNode} from '../../../types';
import {ObjectType} from '../../../types/lww-object/ObjectType';
import {StringType} from '../../../types/rga-string/StringType';
import {Model} from '../../Model';
import {FuzzerOptions} from './types';

type StringOp = typeof InsertStringSubstringOperation | typeof DeleteOperation;
type ArrayOp = typeof InsertArrayElementsOperation | typeof DeleteOperation;
type ObjectOp = typeof SetObjectKeysOperation | typeof DeleteOperation;

export class Picker {
  constructor(public opts: FuzzerOptions) {}

  public pickNode(model: Model): JsonNode | null {
    const [, ...sessions] = [...model.nodes.entries.keys()];
    if (!sessions.length) return null;
    const sessionId = sessions[Math.floor(Math.random() * sessions.length)];
    const map = model.nodes.entries.get(sessionId)!;
    const nodeCount = map.size;
    const index = Math.floor(Math.random() * nodeCount);
    let pos = 0;
    for (const node of map.values()) {
      if (pos === index) return node;
      pos++;
    }
    return null;
  }

  public pickStringOperation(node: StringType): StringOp {
    const length = node.length();
    if (!length) return InsertStringSubstringOperation;
    if (length >= this.opts.maxStringLength) return DeleteOperation;
    if (Math.random() < this.opts.stringDeleteProbability) return DeleteOperation;
    return InsertStringSubstringOperation;
  }

  public pickObjectOperation(node: ObjectType): [key: string, opcode: ObjectOp] {
    if (!node.latest.size) return [this.generateObjectKey(), SetObjectKeysOperation];
    if (Math.random() > 0.5) return [this.generateObjectKey(), SetObjectKeysOperation];
    const keys = [...node.latest.keys()].filter((key) => !node.latest.get(key)!.node.id.isEqual(UNDEFINED_ID));
    if (!keys.length) return [this.generateObjectKey(), SetObjectKeysOperation];
    const key = keys[Math.floor(Math.random() * keys.length)];
    return [key, DeleteOperation];
  }

  public generateCharacter(): string {
    return String.fromCharCode(Math.floor(Math.random() * 65535));
  }

  public generateSubstring(): string {
    const length = Math.floor(Math.random() * this.opts.maxSubstringLength) + 1;
    return this.generateCharacter().repeat(length);
  }

  public generateObjectKey(): string {
    const length = Math.floor(Math.random() * 20) + 1;
    return this.generateCharacter().repeat(length);
  }
}
