import { Api, start } from "./api";
import { State } from "./state";

export function ChessSrs(config: State): Api {
    const state = {...config, method: "learn", queue: []};
    return start(state);
}

