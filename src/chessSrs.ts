import { Api, start } from "./api";
import { Config, configure } from "./config";
import { State, defaults } from "./state";

export function ChessSrs(config?: Config): Api {
	const state = defaults();
	configure(state, config || {})
	return start(state);
}
