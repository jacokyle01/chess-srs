import { Game, PgnNodeData, parsePgn, Node, ChildNode } from "chessops/pgn";
import { State } from "./state";
import {
	Color,
	Method,
	QueueEntry,
	TrainingData,
	TrainingOutcome,
	initializeSubrepertoire,
	initializeTraining,
} from "./util";

export interface Api {
	addSubrepertoires(pgn: string, color: Color): boolean; //add new subrepertoires to repertoire. pgn is parsed as normal, then repertoire is augmented w/ new subrepertoires.
	load(k: number): void; //begin training kth subrepertoire
	guess(san: string): TrainingOutcome; //guess the move this path is trying to train
	setTime(time: number): boolean; //set time of state. boolean: whether or not this new time is different
	setMethod(method: Method): void; //set training method. learn or recall
	state(): State; //get the state of this instance
	next(): boolean; //advance trainer to next path. returns whether or not there was another trainable path
	path(): ChildNode<TrainingData>[] | null; //get the current path
	succeed(): void; //handle training success based on context
	fail(): void; //handle training fail based on context
	update(): void; //set current time
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

		setTime: (time: number) => {
			if (state.time == time) {
				state.time = time;
				return true;
			}
			return false;
		},
		// setRepertoire: (pgn: string) => {
		// 	const games = parsePgn(pgn);
		// 	const annotated: Game<TrainingData>[] = [];
		// 	for (const game of games) {
		// 		game.moves = initializeTraining(game.moves);
		// 		const annotatedGame = {
		// 			...game,
		// 			moves: initializeTraining(game.moves),
		// 		};
		// 		annotated.push(annotatedGame);
		// 	}
		// 	state.repertoire = annotated;
		// 	return true; //dont validate yet
		// },
		state: () => {
			return state;
		},
		setMethod: (method: Method) => {
			state.method = method;
			state.queue = [];
			state.path = null;
		},
		next: () => {
			//TODO refactor -more clear logic, dont use recursion
			//we need to follow the ordering & only consider nodes that are trainable in our context
			let queue = state.queue;
			let flag = false;
			//we have reached the end of the tree/first start
			if (queue.length == 0) {
				flag = true;
				//add all subrepertoire moves
				for (const child of state.subrepertoire.moves.children) {
					const queueEntry: QueueEntry = {
						path: [child],
						layer: 0,
					};
					queue.push(queueEntry);
				}
			}

			let path: ChildNode<TrainingData>[];
			let parent: ChildNode<TrainingData>;
			while (queue.length > 0) {
				const entry: QueueEntry = queue.shift();
				parent = entry.path?.at(-1);
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
			}
			if (!flag) {
				return this.next(); //if we didnt start from an empty queue, search again from start
			}
			this.path = null;
			return false;
		},
		load: (k: number) => {
			state.subrepertoire = state.repertoire[k];
		},
		path: () => {
			// return state.path;
			return state.path;
		},
		guess: (san: string) => {
			if (!state.path || state.method == "learn") return;
			console.log(state.path.at(-1)?.data.san);
			if (san == state.path.at(-1)?.data.san) {
				return "success";
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
		update: () => {
			state.time = Math.round(Date.now() / 1000);
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
