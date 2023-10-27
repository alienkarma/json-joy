/**
 * @category Patch
 */
export class VectorDelayedValue<T extends unknown[]> {
  constructor(public readonly slots: T) {}
}

/**
 * @todo Rename to `vec`.
 * @param slots
 * @returns
 */
export const vec = <T extends unknown[]>(...slots: T): VectorDelayedValue<T> => new VectorDelayedValue(slots);
