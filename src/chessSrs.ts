import { Api, start } from "./api.js";
import { Config, configure } from "./config.js";
import { State, defaults } from "./state.js";

export function ChessSrs(config?: Config): Api {
	const state = defaults();
	configure(state, config || {})
	return start(state);
}
