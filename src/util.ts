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
		comments: data.comments ? data.comments + "/*unseen,0*/" : "/*unseen,0*/",
	};
};

export const initializeTraining = (head: Node<PgnNodeData>) => {
    return transform(head, context, markUnseen);
}
