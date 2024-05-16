import { State } from "./state";
import { DequeEntry } from "./types";

export const exploreBfs = (state: State): boolean => {
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
        const entry = deque.shift()!;
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

        //endeque child nodes
        for (const child of pos.children) {
          const DequeEntry: DequeEntry = {
            path: [...entry.path, child],
            layer: ++entry.layer,
          };
          deque.push(DequeEntry);
        }
      }
      return false;
}

export const exploreDfs = (state: State): boolean => {
  return false;
}