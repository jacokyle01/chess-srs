import { Game, PgnNodeData, parsePgn, Node } from "chessops/pgn";
import { State } from "./state";
import { Method, TrainingData, initializeTraining } from "./util";

export interface Api {
    sayHello(): void;
    sayNumber(): void
    initialize(k: number): void; //load kth subrepertoire into 'TrainingOrder'. all nodes will be unseen
    load(k: number): void; //begin training kth subrepertoire
    setTime(time: number): boolean //set time of state. boolean: whether or not this new time is different
    setMethod(method: Method);
    setRepertoire(pgn: string): boolean //load repertoire into memory, annotates as unseen. boolean: whether not this was a valid PGN
    getRepertoire(): Game<TrainingData>[];
    getNext(): Node<TrainingData>[]; //get next training path, which is a list of nodes that lead to a trainable position
    // doTrain(action: Action) this --> a bunch of switch statements?
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
                    moves: initializeTraining(game.moves)
                }
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
        getNext: () => {
            //we need to follow the ordering & only consider nodes that are trainable in our context
            let queue = state.queue;
            if (queue.length == 0) {
                //add all subrepertoire moves 
                for (const child of state.subrepertoire.moves.children) {
                    queue.push([child]);
                }
            }

            const path = queue.shift();
            const parent = path?.at(-1);
            for (const child of parent.children) {
                queue.push([...path, child])
            }
            return path;

        },
        load: (k: number) => {
            state.subrepertoire = state.repertoire[k];
        }
    }
}