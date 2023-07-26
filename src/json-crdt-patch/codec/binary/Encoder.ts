import * as operations from '../../operations';
import {JsonCrdtPatchOpcode} from '../../constants';
import {CrdtWriter} from '../../util/binary/CrdtEncoder';
import {ITimespanStruct, ITimestampStruct, Timestamp} from '../../clock';
import {CborEncoder} from '../../../json-pack/cbor/CborEncoder';
import {SESSION} from '../../constants';
import type {JsonCrdtPatchOperation, Patch} from '../../Patch';

export class Encoder extends CborEncoder<CrdtWriter> {
  private patchId!: ITimestampStruct;

  constructor(public readonly writer: CrdtWriter = new CrdtWriter()) {
    super(writer);
  }

  public encode(patch: Patch): Uint8Array {
    this.writer.reset();
    const id = (this.patchId = patch.getId()!);
    const isServerClock = id.sid === SESSION.SERVER;
    const writer = this.writer;
    if (isServerClock) {
      writer.b1vu56(true, id.time);
    } else {
      writer.b1vu56(false, id.sid);
      writer.vu57(id.time);
    }
    const meta = patch.meta;
    if (meta === undefined) this.writeNull();
    else this.writeArr([meta]);
    this.encodeOperations(patch);
    return writer.flush();
  }

  public encodeOperations(patch: Patch): void {
    const ops = patch.ops;
    for (let i = 0; i < ops.length; i++) {
      const op = ops[i];
      this.encodeOperation(op);
    }
  }

  public encodeId(id: ITimestampStruct) {
    const sessionId = id.sid;
    const time = id.time;
    const writer = this.writer;
    if (sessionId === SESSION.SERVER) {
      writer.b1vu56(true, id.time);
    } else {
      const patchId = this.patchId;
      let vu56: number = 1;
      let vu57: number = time;
      if (sessionId === patchId.sid && time >= patchId.time) vu57 = time - patchId.time;
      else vu56 = sessionId;
      writer.b1vu56(false, vu56);
      writer.vu57(vu57);
    }
  }

  protected encodeTss(span: ITimespanStruct): void {
    this.encodeId(span);
    this.writer.vu57(span.span);
  }

  private writeInsStr(length: number, obj: ITimestampStruct, ref: ITimestampStruct, str: string): number {
    const writer = this.writer;
    if (length <= 0b111) {
      writer.u8((length << 5) | JsonCrdtPatchOpcode.ins_str);
    } else {
      writer.u8(JsonCrdtPatchOpcode.ins_str);
      writer.vu57(length);
    }
    this.encodeId(obj);
    this.encodeId(ref);
    return writer.utf8(str);
  }

  public encodeOperation(op: JsonCrdtPatchOperation): void {
    const writer = this.writer;
    const constructor = op.constructor;
    switch (constructor) {
      case operations.NewConOp: {
        const operation = <operations.NewConOp>op;
        const val = operation.val;
        if (val instanceof Timestamp) {
          writer.u8(0b001_00000 | JsonCrdtPatchOpcode.new_con);
          this.encodeId(val);
        } else {
          writer.u8(JsonCrdtPatchOpcode.new_con);
          this.writeAny(val);
        }
        break;
      }
      case operations.NewValOp: {
        const operation = <operations.NewValOp>op;
        const val = operation.val;
        writer.u8(JsonCrdtPatchOpcode.new_val);
        this.encodeId(val);
        break;
      }
      case operations.NewObjOp: {
        writer.u8(JsonCrdtPatchOpcode.new_obj);
        break;
      }
      case operations.NewVecOp: {
        writer.u8(JsonCrdtPatchOpcode.new_vec);
        break;
      }
      case operations.NewStrOp: {
        writer.u8(JsonCrdtPatchOpcode.new_str);
        break;
      }
      case operations.NewBinOp: {
        writer.u8(JsonCrdtPatchOpcode.new_bin);
        break;
      }
      case operations.NewArrOp: {
        writer.u8(JsonCrdtPatchOpcode.new_arr);
        break;
      }
      case operations.InsValOp: {
        const operation = <operations.InsValOp>op;
        writer.u8(JsonCrdtPatchOpcode.ins_val);
        this.encodeId(operation.obj);
        this.encodeId(operation.val);
        break;
      }
      case operations.InsObjOp: {
        const operation = <operations.InsObjOp>op;
        const data = operation.data;
        const length = data.length;
        if (length <= 0b111) {
          writer.u8((length << 5) | JsonCrdtPatchOpcode.ins_obj);
        } else {
          writer.u8(JsonCrdtPatchOpcode.ins_obj);
          writer.vu57(length);
        }
        this.encodeId(operation.obj);
        for (let i = 0; i < length; i++) {
          const tuple = data[i];
          this.writeStr(tuple[0]);
          this.encodeId(tuple[1]);
        }
        break;
      }
      case operations.InsVecOp: {
        const operation = <operations.InsVecOp>op;
        const data = operation.data;
        const length = data.length;
        if (length <= 0b111) {
          writer.u8((length << 5) | JsonCrdtPatchOpcode.ins_vec);
        } else {
          writer.u8(JsonCrdtPatchOpcode.ins_vec);
          writer.vu57(length);
        }
        this.encodeId(operation.obj);
        for (let i = 0; i < length; i++) {
          const tuple = data[i];
          writer.u8(tuple[0]);
          this.encodeId(tuple[1]);
        }
        break;
      }
      case operations.InsStrOp: {
        const operation = <operations.InsStrOp>op;
        const obj = operation.obj;
        const ref = operation.ref;
        const str = operation.data;
        const len1 = str.length;
        writer.ensureCapacity(24 + len1 * 4);
        const x = writer.x;
        const len2 = this.writeInsStr(len1, obj, ref, str);
        if (len1 !== len2) {
          writer.x = x;
          this.writeInsStr(len2, obj, ref, str);
        }
        break;
      }
      case operations.InsBinOp: {
        const operation = <operations.InsBinOp>op;
        const buf = operation.data;
        const length = buf.length;
        if (length <= 0b111) {
          writer.u8((length << 5) | JsonCrdtPatchOpcode.ins_bin);
        } else {
          writer.u8(JsonCrdtPatchOpcode.ins_bin);
          writer.vu57(length);
        }
        this.encodeId(operation.obj);
        this.encodeId(operation.ref);
        writer.buf(buf, length);
        break;
      }
      case operations.InsArrOp: {
        const operation = <operations.InsArrOp>op;
        const elements = operation.data;
        const length = elements.length;
        if (length <= 0b111) {
          writer.u8((length << 5) | JsonCrdtPatchOpcode.ins_arr);
        } else {
          writer.u8(JsonCrdtPatchOpcode.ins_arr);
          writer.vu57(length);
        }
        this.encodeId(operation.obj);
        this.encodeId(operation.ref);
        for (let i = 0; i < length; i++) this.encodeId(elements[i]);
        break;
      }
      case operations.DelOp: {
        const operation = <operations.DelOp>op;
        const what = operation.what;
        const length = what.length;
        if (length <= 0b111) {
          writer.u8((length << 5) | JsonCrdtPatchOpcode.del);
        } else {
          writer.u8(JsonCrdtPatchOpcode.del);
          writer.vu57(length);
        }
        this.encodeId(operation.obj);
        for (let i = 0; i < length; i++) this.encodeTss(what[i]);
        break;
      }
      case operations.NopOp: {
        const operation = <operations.NopOp>op;
        const length = operation.len;
        if (length <= 0b111) {
          writer.u8((length << 5) | JsonCrdtPatchOpcode.nop);
        } else {
          writer.u8(JsonCrdtPatchOpcode.nop);
          writer.vu57(length);
        }
        break;
      }
      default: {
        throw new Error('UNKNOWN_OP');
      }
    }
  }
}
