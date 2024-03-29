import { parsePgn, ChildNode } from "chessops/pgn.js";
import { State } from "./state.js";
import { initializeSubrepertoire } from "./util.js";

import {
	Color,
	Method,
	QueueEntry,
	TrainingData,
	TrainingOutcome,
} from "./types.js";

export interface Api {
	addSubrepertoires(pgn: string, color: Color): boolean; //add new subrepertoires to repertoire. pgn is parsed as normal, then repertoire is augmented w/ new subrepertoires.
	load(k: number): void; //begin training kth subrepertoire
	guess(san: string): TrainingOutcome | undefined; //guess the move this path is trying to train //TODO instead null?
	update(time?: number): boolean; //set time of state, or set time to now. boolean: whether or not this new time is different
	setMethod(method: Method): void; //set training method. learn or recall
	state(): State; //get the state of this instance
	next(): boolean | null; //advance trainer to next path. returns whether or not there was another trainable path, undefined if no subrepertoire.
	path(): ChildNode<TrainingData>[] | null; //get the current path
	succeed(): void; //handle training success based on context
	fail(): void; //handle training fail based on context
}

export function start(state: State): Api {
	return {
		addSubrepertoires: (pgn: string, color: Color) => {
			const subreps = parsePgn(pgn);
			for (const subrep of subreps) {
				//augment subrepertoire with a) color to train as, and b) training data
				const annotatedSubrep = {
					...subrep,
					headers: {
						...subrep.headers,
						TrainAs: color,
					},
					moves: initializeSubrepertoire(subrep.moves, color),
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
		state: () => {
			return state;
		},
		setMethod: (method: Method) => {
			state.method = method;
			state.queue = [];
			state.path = null;
		},
		next: () => {
			// //TODO refactor -more clear logic, dont use recursion
			if (!state.subrepertoire) return false;
			let queue = state.queue;
			let first = true; //flag for whether or not this dequeued element is the first
			let flag = false; //record whether or not we've done a complete exploration of the opening tree

			//initialize queue if empty
			if (queue.length == 0) {
				flag = true;
				for (const child of state.subrepertoire.moves.children) {
					const queueEntry: QueueEntry = {
						path: [child],
						layer: 0,
					};
					queue.push(queueEntry);
				}
			}

			// let path: ChildNode<TrainingData>[];
			let parent: ChildNode<TrainingData>;
			let id = -1;

			while (queue.length > 0) {
				const maybeEntry: QueueEntry | undefined = queue.shift();
				if (!maybeEntry) {
					return null;
				}
				const entry: QueueEntry = maybeEntry;
				const maybeParent: ChildNode<TrainingData> | undefined =
					entry.path.at(-1);
				if (!maybeParent) {
					return null;
				}
				parent = maybeParent;
				if (first) {
					id = parent.data.training.id;
					first = false;
				} else {
					//handle loop around
					if (parent.data.training.id == id) {
						return false;
					}
				}

				for (const child of parent.children) {
					const queueEntry: QueueEntry = {
						path: [...entry.path, child],
						layer: ++entry.layer,
					};
					queue.push(queueEntry);
				}

				if (!parent.data.training.disabled) {
					switch (state.method) {
						case "recall": //recall if due
							if (parent.data.training.dueAt <= state.time) {
								state.path = entry.path;
								return true;
							}
							break;
						case "learn": //learn if unseen
							if (!parent.data.training.seen) {
								state.path = entry.path;
								return true;
							}
							break;
					}
				}

				if (queue.length == 0) {
					if (flag) {
						return false;
					} else {
						flag = true;
						for (const child of state.subrepertoire.moves.children) {
							const queueEntry: QueueEntry = {
								path: [child],
								layer: 0,
							};
							queue.push(queueEntry);
						}
					}
				}
			}
			return null;
		},
		load: (k: number) => {
			state.subrepertoire = state.repertoire[k];
		},
		path: () => {
			// return state.path;
			return state.path;
		},
		guess: (san: string) => {
			if (!state.subrepertoire) return;
			if (!state.path || state.method == "learn") return undefined;
			let candidates: ChildNode<TrainingData>[] = [];
			if (state.path.length == 1) {
				state.subrepertoire.moves.children.forEach((child) =>
					candidates.push(child)
				);
			} else {
				state.path.at(-2)?.children.forEach((child) => candidates.push(child));
			}

			let moves: string[] = [];
			moves = candidates.map((candidate) => candidate.data.san);

			if (moves.includes(san)) {
				if (state.path.at(-1)?.data.san == san) {
					//exact match
					return "success";
				} else {
					return "alternate";
				}
			} else {
				return "failure";
			}
		},
		succeed: () => {
			let node = state?.path?.at(-1);
			if (!node) return;
			switch (state.method) {
				case "recall":
					switch (state.promotion) {
						case "most":
							break;
						case "next":
							node.data.training.group = Math.min(
								node.data.training.group + 1,
								state.buckets.length - 1
							);
							const space = state.buckets[node.data.training.group];
							node.data.training.dueAt = state.time + space;
							break;
					}
					break;
				case "learn":
					node.data.training.seen = true;
					node.data.training.dueAt = state.time + state.buckets[0];
					node.data.training.group = 0;
					break;
			}
		},
		fail: () => {
			let node = state?.path?.at(-1);
			if (!node) return;
			switch (state.method) {
				case "recall":
					switch (state.demotion) {
						case "most":
							break;
						case "next":
							node.data.training.group = Math.max(
								node.data.training.group - 1,
								0
							);
							const space = state.buckets[node.data.training.group];
							node.data.training.dueAt = state.time + space;
					}
				case "learn":
					break; //can't fail learning
			}
		},
	};
}
