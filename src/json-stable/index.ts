import {escape} from '@jsonjoy.com/json-pack/lib/util/strings/escape';
import {sort} from '../util/sort/insertion';
import type {json_string} from '../json-brand';

const getKeys = Object.keys;

export const stringify = <T>(val: T): json_string<T> => {
  let i, max, str, keys, key, propVal;
  switch (typeof val) {
    case 'string':
      return ('"' + escape(val) + '"') as json_string<T>;
    case 'object':
      if (val instanceof Array) {
        str = '[';
        max = val.length - 1;
        for (i = 0; i < max; i++) str += stringify(val[i]) + ',';
        if (max >= 0) str += stringify(val[i]);
        return (str + ']') as json_string<T>;
      }
      if (val === null) return 'null' as json_string<T>;
      keys = sort(getKeys(val));
      max = keys.length;
      str = '{';
      i = 0;
      while (i < max) {
        key = keys[i];
        propVal = stringify((val as Record<string, unknown>)[key]);
        if (i && str !== '') str += ',';
        str += '"' + escape(key) + '":' + propVal;
        i++;
      }
      return (str + '}') as json_string<T>;
    default:
      return String(val) as json_string<T>;
  }
};
