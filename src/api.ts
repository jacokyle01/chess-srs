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
	guess(san: string): TrainingOutcome | null; //guess the move this path is trying to train
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
			if (state.time != time) {
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
			// //TODO refactor -more clear logic, dont use recursion

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

			let path: ChildNode<TrainingData>[];
			let parent: ChildNode<TrainingData>;
			let id = -1;

			while (queue.length > 0) {
				const entry: QueueEntry = queue.shift();
				parent = entry.path?.at(-1);
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
		},
		load: (k: number) => {
			state.subrepertoire = state.repertoire[k];
		},
		path: () => {
			// return state.path;
			return state.path;
		},
		guess: (san: string) => {
			console.log("guessing " + san);
			if (!state.path || state.method == "learn") return null;
			let candidates: ChildNode<TrainingData>[] = [];
			console.log("guessing #2");
			if (state.path.length == 1) {
				state.subrepertoire.moves.children.forEach(child => candidates.push(child));
			}
			else {
				console.log("\n\t\tchildren");
				state.path.at(-2).children.forEach(child => candidates.push(child));
			}
			console.log("\n\t\tcandidates\n");
			candidates.forEach(candidate => console.log(candidate.data));

			let moves: string[] = [];
			moves = candidates.map(candidate => candidate.data.san);

			if (moves.includes(san)) {
				if (state.path.at(-1).data.san == san) //exact match
				{
					return "success";
				}
				else {
					return "alternate";
				}
			}
			else {
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
