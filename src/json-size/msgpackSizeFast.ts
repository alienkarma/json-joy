import {JsonPackExtension, JsonPackValue} from "../json-pack";
import {isUint8Array} from "../util/isUint8Array";

const arraySize = (arr: unknown[]): number => {
  let size = 2;
  for (let i = arr.length - 1; i >= 0; i--) size += msgpackSizeFast(arr[i]);
  return size;
};

const objectSize = (obj: Record<string, unknown>): number => {
  let size = 2;
  for (const key in obj) if (obj.hasOwnProperty(key)) size += 2 + key.length + msgpackSizeFast(obj[key]);
  return size;
};

/**
 * Same as `jsonSizeFast`, but for MessagePack.
 *
 * - Allows Buffers or Uint8Arrays a MessagePack `bin` values. Adds 5 bytes overhead for them.
 * - Allows embedded `JsonPackValue` values.
 * - Allows MessagePack `JsonPackExtension` extensions. Adds 6 bytes overhead for them.
 *
 * @param value MessagePack value, which can contain binary data, extensions and embedded MessagePack.
 * @returns Approximate size of the value in bytes.
 */
export const msgpackSizeFast = (value: unknown): number => {
  if (isUint8Array(value)) return 5 + value.byteLength;
  if (value instanceof JsonPackValue) return (value as JsonPackValue).buf.byteLength;
  if (value instanceof JsonPackExtension) return 6 + (value as JsonPackExtension).buf.byteLength;
  if (value === null) return 1;
  switch (typeof value) {
    case 'number':
      return 9;
    case 'string':
      return 4 + value.length;
    case 'boolean':
      return 1;
  }
  if (value instanceof Array) return arraySize(value);
  return objectSize(value as Record<string, unknown>);
};
