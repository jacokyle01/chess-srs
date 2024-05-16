import { State } from './state.js';

export interface Config {
  getNext?: {
    by?: 'depth' | 'breadth'; // exploration strategy to find next position
    max?: number; //dont look at positions after this many moves
  };
  buckets?: number[]; //the "spaces" for spaced repetition. see "leitner system"
  promotion?: 'most' | 'next';
  demotion?: 'most' | 'next';
}

export function configure(state: State, config: Config): void {
  deepMerge(state, config);
}

function deepMerge(base: any, extend: any): void {
  for (const key in extend) {
    if (Object.prototype.hasOwnProperty.call(extend, key)) {
      if (
        Object.prototype.hasOwnProperty.call(base, key) &&
        isPlainObject(base[key]) &&
        isPlainObject(extend[key])
      )
        deepMerge(base[key], extend[key]);
      else base[key] = extend[key];
    }
  }
}

function isPlainObject(o: unknown): boolean {
  if (typeof o !== 'object' || o === null) return false;
  const proto = Object.getPrototypeOf(o);
  return proto === Object.prototype || proto === null;
}
