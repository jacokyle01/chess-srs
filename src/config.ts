import { State } from "./state"

export interface Config {
    learn?: { //when variation is unsee 
        by?: "depth" | "breadth", //how we find the next variation
        max?: number //dont look at variations after this many moves 
    }
    recall?: { //after a variation has already been seen
        by?: "depth" | "breadth",
        max?: number
    }
    buckets?: number[] //the "spaces" for spaced repetition. see "leitner system"
    promotion?: "most" | "next"
    demotion?: "most" | "next"
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