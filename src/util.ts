import { transform } from "chessops/pgn.js";
import { PgnNodeData, Node, ChildNode} from "chessops/pgn.js";
import { Color, Context, PathContext, TrainingContext, TrainingData } from "./types";

export const trainingContext = (color: Color): TrainingContext => {
	return {
		trainable: color == "white",
		id: -1,
		clone() {
			const clonedCtx: TrainingContext = { 
				...this,
			 };
			return clonedCtx;
		},
	};
};

//initialize a raw pgn. does the following:
//a) marks moves made by our color as "trainable"
//b) disables training of moves made by opposite color

export const initializeSubrepertoire = (
	root: Node<PgnNodeData>,
	color: Color
): Node<TrainingData> => {
	const context = trainingContext(color);
	let idCount = 0;
	return transform(root, context, (context, data) => {
		context.trainable = !context.trainable;
		context.id++;
		idCount++;
		return {
			...data,
			training: {
				id: idCount,
				disabled: context.trainable,
				seen: false,
				group: -1,
				dueAt: Infinity,
			},
		};
	});
};

const context: Context = {
	clone() {
		const clonedCtx: Context = { ...this };
		return clonedCtx;
	},
};

const markUnseen = (ctx: Context, data: PgnNodeData) => {
	return {
		...data,
		training: {
			seen: false,
			group: -1,
			dueAt: Infinity,
		},
	};
};

export const initializeTraining = (head: Node<PgnNodeData>) => {
	return transform(head, context, markUnseen);
};

export const pathContext: PathContext = {
	path: "",
	clone() {
		const clonedCtx: PathContext = { ...this };
		return clonedCtx;
	},
};

export const annotateWithPaths = (node: Node<PgnNodeData>) => {
	return transform(node, pathContext, (pathContext, node) => {
		const san = node.san;
		pathContext.path += " " + san;
		return {
			...node,
			pathToHere: pathContext.path,
		};
	});
};

//debug
//print path as string of SANs
export const printPath = (path: ChildNode<TrainingData>[]): void => {
	let string = "";
	for (const step of path) {
		string += step.data.san + " ";
	}
	console.log(string);
};
