import { ChildNode, PgnNodeData } from "chessops/pgn";

export type Color = "white" | "black";
export type Method = "recall" | "learn";
export type TrainingOutcome = "success" | "alternate" | "failure";

//TODO trainAsColor, depth, only first child
export interface TrainingContext {
	trainable: boolean;
	id: number;
	clone(): TrainingContext;
}

export interface TrainingData extends PgnNodeData {
	training: {
		id: number;
		disabled: boolean;
		seen: boolean;
		group: number;
		dueAt: number;
	};
}

export interface QueueEntry {
	path: ChildNode<TrainingData>[];
	layer: number;
}

export interface Context {
	clone(): Context;
}

export interface PathContext {
	path: string;
	clone(): PathContext;
}
