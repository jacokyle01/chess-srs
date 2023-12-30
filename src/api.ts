import { Game, PgnNodeData, parsePgn, Node, ChildNode } from "chessops/pgn";
import { State } from "./state";
import { Method, TrainingData, initializeTraining } from "./util";

export interface Api {
	sayHello(): void;
	sayNumber(): void;
	initialize(k: number): void; //load kth subrepertoire into 'TrainingOrder'. all nodes will be unseen
	load(k: number): void; //begin training kth subrepertoire
	setTime(time: number): boolean; //set time of state. boolean: whether or not this new time is different
	setMethod(method: Method);
	setRepertoire(pgn: string): boolean; //load repertoire into memory, annotates as unseen. boolean: whether not this was a valid PGN
	getRepertoire(): Game<TrainingData>[];
	next(): boolean; //advance trainer to next path returns whether or not there was another trainable path
	path(): ChildNode<TrainingData>[] | null; //get the current path
	succeed(): void; //handle training success based on context
}

export function start(state: State): Api {
	return {
		sayHello: () => console.log("hello"),
		sayNumber: () => console.log(state.count),
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
			this.method = method;
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
                //TODO add switch statement here to change targeting logic based on `method`
                if (parent.data.training.group == "unseen") {
					state.path = path;
                    return true;
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
			if (state.path == null) return;
			state.path.at(-1).data.training.group = "seen";
		}
	};
}
