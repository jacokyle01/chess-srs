import { parsePgn, ChildNode, Game, PgnNodeData, walk } from 'chessops/pgn.js';
import { State } from './state.js';
import { countDueContext, generateSubrepertoire } from './util.js';

import {
  Color,
  Method,
  DequeEntry,
  Subrepertoire,
  TrainingData,
  TrainingOutcome,
  CountDueContext,
} from './types.js';
import { Config, configure } from './config.js';
export interface Api {
  // reconfigure the instance. accepts all config options except buckets
  set(config: Config): void;

  //add new subrepertoires to repertoire.
  //pgn is parsed as normal, then repertoire is augmented w/ new subrepertoires.
  addSubrepertoires(pgn: string, color: Color): boolean;

  //begin training kth subrepertoire
  load(k: number): void;

  //guess the move this path is trying to train
  guess(san: string): TrainingOutcome | undefined;

  //set time of state, or set time to now.
  //returns boolean: whether or not this new time is different
  update(time?: number): boolean;

  //set training method. learn or recall
  setMethod(method: Method): void;

  //get the state of this instance
  state: State;

  //try to advance path to next trainable path,
  //return whether or not this was possible.
  next(): boolean;

  //get the current trainable path
  path(): ChildNode<TrainingData>[] | null;

  //handle training success based on context
  succeed(): void;

  //handle training fail based on context
  fail(): void;

  //count nodes that are due for training
  countDue(): number;

  //shortcut to get current subrepertoire
  current(): Subrepertoire<TrainingData>;
}

export function start(state: State): Api {
  return {
    set(config): void {
      configure(state, config);
    },

    addSubrepertoires: (pgn: string, color: Color) => {
      const subreps: Game<PgnNodeData>[] = parsePgn(pgn);
      for (const subrep of subreps) {
        //augment subrepertoire with a) color to train as, and b) training data
        const annotatedSubrep: Subrepertoire<TrainingData> = {
          ...subrep,
          headers: {
            ...subrep.headers,
          },
          ...generateSubrepertoire(subrep.moves, color, state.buckets),
        };
        state.repertoire.push(annotatedSubrep);
      }
      return true;
    },

    update: (time?: number) => {
      let newTime = time || Math.floor(Date.now() / 1000);
      if ((state.time = newTime)) {
        return false;
      }
      state.time = newTime;
      return true;
    },

    state,

    setMethod: (method: Method) => {
      state.method = method;
      state.path = null;
    },
    next: () => {
      if (state.index == -1) return false; // no subrepertoire selected
      //initialization
      let deque: DequeEntry[] = [];
      let subrep = state.repertoire[state.index];
      //initialize deque
      for (const child of subrep.moves.children) {
        deque.push({
          path: [child],
          layer: 0,
        });
      }
      while (deque.length != 0) {
        //initialize dedequed path
        const entry = state.getNext.by == 'breadth' ? deque.shift()! : deque.pop()!;
        const pos = entry.path.at(-1)!;

        //test if match
        if (!pos.data.training.disabled) {
          switch (state.method) {
            case 'recall': //recall if due
              if (pos.data.training.dueAt <= state.time) {
                state.path = entry.path;
                return true;
              }
              break;
            case 'learn': //learn if unseen
              if (!pos.data.training.seen) {
                state.path = entry.path;
                return true;
              }
              break;
          }
        }

        //push child nodes
        if (entry.layer < state.getNext.max) {
          for (const child of pos.children) {
            const DequeEntry: DequeEntry = {
              path: [...entry.path, child],
              layer: ++entry.layer,
            };
            deque.push(DequeEntry);
          }
        }
      }
      return false;
    },
    load: (k: number) => {
      if (k >= state.repertoire.length) {
        throw new Error(`Index ${k} is out of bounds for repertoire of size ${state.repertoire.length}`);
      }
      state.index = k;
    },
    path: () => {
      return state.path;
    },
    guess: (san: string) => {
      const index = state.index;
      if (index == -1 || !state.path || state.method == 'learn') return;
      let candidates: ChildNode<TrainingData>[] = [];
      if (state.path.length == 1) {
        state.repertoire[index].moves.children.forEach(child => candidates.push(child));
      } else {
        state.path.at(-2)?.children.forEach(child => candidates.push(child));
      }

      let moves: string[] = [];
      moves = candidates.map(candidate => candidate.data.san);

      return moves.includes(san)
        ? state.path.at(-1)?.data.san === san
          ? 'success'
          : 'alternate'
        : 'failure';
    },
    succeed: () => {
      const node = state.path?.at(-1);
      const subrep = state.repertoire[state.index];
      if (!node) return;
      switch (state.method) {
        case 'recall':
          let groupIndex = node.data.training.group;
          subrep.meta.bucketEntries[groupIndex]--;
          switch (state.promotion) {
            case 'most':
              groupIndex = state.buckets.length - 1;
              break;
            case 'next':
              groupIndex = Math.min(groupIndex + 1, state.buckets.length - 1);
              break;
          }
          subrep.meta.bucketEntries[groupIndex]++;
          const interval = state.buckets[groupIndex];

          node.data.training = {
            ...node.data.training,
            group: groupIndex,
            dueAt: state.time + interval,
          };
          break;
        case 'learn':
          node.data.training = {
            ...node.data.training,
            seen: true,
            dueAt: state.time + state.buckets[0],
            group: 0,
          };
          subrep.meta.bucketEntries[0]++; //globally, mark node as seen
          break;
      }
    },
    fail: () => {
      let node = state.path?.at(-1);
      const subrep = state.repertoire[state.index];
      if (!node) return;
      let groupIndex = node.data.training.group;
      subrep.meta.bucketEntries[groupIndex]--;
      switch (state.method) {
        case 'recall':
          switch (state.demotion) {
            case 'most':
              groupIndex = 0;
              break;
            case 'next':
              groupIndex = Math.max(groupIndex - 1, 0);
              break;
          }
          subrep.meta.bucketEntries[groupIndex]++;
          const interval = state.buckets[groupIndex];

          node.data.training = {
            ...node.data.training,
            group: groupIndex,
            dueAt: state.time + interval,
          };
        case 'learn':
          break; //can't fail learning
      }
    },
    countDue: () => {
      const current = state.repertoire[state.index];
      const root = current.moves;
      let count = 0;
      const ctx = countDueContext(0);
      walk(root, ctx, (ctx, data) => {
        ctx.count += !data.training.disabled && data.training.dueAt < state.time ? 1 : 0;
      });
      return ctx.count;
    },

    current: () => {
      return state.repertoire[state.index];
    },
  };
}
