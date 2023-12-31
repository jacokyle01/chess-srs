import { Game, PgnNodeData, parsePgn, Node, ChildNode } from "chessops/pgn";
import { State } from "./state";
import { Method, TrainingData, initializeTraining } from "./util";

export interface Api {
	load(k: number): void; //begin training kth subrepertoire
	setTime(time: number): boolean; //set time of state. boolean: whether or not this new time is different
	setMethod(method: Method): void;
	setRepertoire(pgn: string): boolean; //load repertoire into memory, annotates as unseen. boolean: whether not this was a valid PGN
	getRepertoire(): Game<TrainingData>[];
	next(): boolean; //advance trainer to next path returns whether or not there was another trainable path
	path(): ChildNode<TrainingData>[] | null; //get the current path
	succeed(): void; //handle training success based on context
	fail(): void; //handle training fail based on context
	update(): void //set current time
}

export function start(state: State): Api {
	return {
		setTime: (time: number) => {
			if (state.time == time) {
				state.time = time;
				return true;
			}
			return false;
		},
		setRepertoire: (pgn: string) => {
			const games = parsePgn(pgn);
			const annotated: Game<TrainingData>[] = [];
			for (const game of games) {
				game.moves = initializeTraining(game.moves);
				const annotatedGame = {
					...game,
					moves: initializeTraining(game.moves),
				};
				annotated.push(annotatedGame);
			}
			state.repertoire = annotated;
			return true; //dont validate yet
		},
		getRepertoire: () => {
			return state.repertoire;
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
					queue.push([child]);
				}
			}

            let path: ChildNode<TrainingData>[];
            let parent: ChildNode<TrainingData>;
			while (queue.length > 0) {
                path = queue.shift();
                parent = path?.at(-1); 
				for (const child of parent.children) {
					queue.push([...path, child]);
				}
				switch(state.method) {
					case "recall": //recall if due 
						if (parent.data.training.dueAt <= state.time) {
							state.path = path;
							return true;
						}
						break;
					case "learn": //learn if unseen 
						if (!parent.data.training.seen) {
							state.path = path;
							return true;
						}
						break;
				}
			}
            if (!flag) {
                return this.getNext(); //if we didnt start from an empty queue, search again from start 
            }
			this.path = null;
			return false;

		},
		load: (k: number) => {
			state.subrepertoire = state.repertoire[k];
		},
		path: () => { 
			return state.path;
		},
		succeed: () => {
			let node = state?.path?.at(-1);
			if (!node) return;
			switch(state.method) {
				case "recall":
					switch(state.promotion) {
						case "most":
							break;
						case "next":
							node.data.training.group = Math.min(node.data.training.group + 1, state.buckets.length - 1);
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
			switch(state.method) {
				case "recall":
					switch(state.demotion) {
						case "most":
							break;
						case "next":
							node.data.training.group = Math.max(node.data.training.group - 1, 0);
							const space = state.buckets[node.data.training.group];
							node.data.training.dueAt = state.time + space;
					}
				case "learn":
					break; //can't fail learning
			}
		}
		
	};
}
