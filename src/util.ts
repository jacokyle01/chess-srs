import { transform } from "chessops/pgn";
import { PgnNodeData, Node } from "chessops/pgn";



interface Context {
	clone(): Context;
}

const context: Context = {
	clone() {
		const clonedCtx: Context = { ...this };
		return clonedCtx;
	},
};

const markUnseen = (ctx: Context, data, childIndex) => {
	return {
		...data,
		training: {
            group: "unseen",
            dueAt: Infinity
        }
	};
};

export const initializeTraining = (head: Node<PgnNodeData>) => {
    return transform(head, context, markUnseen);
}

interface PathContext {
	path: string;
	clone(): PathContext;
}

const pathContext: PathContext = {
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
    })
}