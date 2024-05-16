import { State } from "./state";
import { QueueEntry } from "./types";

export const exploreDfs = (state: State): boolean => {
  if (state.index == -1) return false; // no subrepertoire selected
      //initialization
      let queue: QueueEntry[] = [];
      let subrep = state.repertoire[state.index];
      //initialize queue
      for (const child of subrep.moves.children) {
        queue.push({
          path: [child],
          layer: 0,
        });
      }
      while (queue.length != 0) {
        //initialize dequeued path
        const entry = queue.shift()!;
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

        //enqueue child nodes
        for (const child of pos.children) {
          const queueEntry: QueueEntry = {
            path: [...entry.path, child],
            layer: ++entry.layer,
          };
          queue.push(queueEntry);
        }
      }
      return false;
}