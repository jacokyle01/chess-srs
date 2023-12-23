import { Game, PgnNodeData, parsePgn } from "chessops/pgn";
import { State } from "./state";
import { TrainingData, initializeTraining } from "./util";

export interface Api {
    sayHello(): void;
    sayNumber(): void
    initialize(k: number): void; //load kth subrepertoire into 'TrainingOrder'. all nodes will be unseen
    load(k: number): void; //load kth subreperoire into `TrainingOrder` 
    setTime(time: number): boolean //set time of state. boolean: whether or not this new time is different 
    setRepertoire(pgn: string): boolean //load repertoire into memory, annotates as unseen. boolean: whether not this was a valid PGN
    getRepertoire(): Game<PgnNodeData>[];
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
        }
    }
}