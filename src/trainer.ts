import { Api, start } from "./api";
import { Config } from "./config";
import { State, defaults } from "./state";

export function ChessSrs(config?: Config): Api {
	const state = defaults();
	return start(state);
}
