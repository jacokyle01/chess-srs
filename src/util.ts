import { Game, transform, walk } from "chessops/pgn";
import { PgnNodeData, Node, ChildNode } from "chessops/pgn";



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

//function to find and modify node by path 
export const transformNode = (subrep: Game<PgnNodeData>, path: string, f: (target: Node<PgnNodeData>) => Node<PgnNodeData>) => {
	const steps = path.split(" ");
	console.log(steps);
	console.log(subrep.moves.children.find(child => child.data.san == steps[0])); 

	let current: ChildNode<PgnNodeData> | undefined;
	current = subrep.moves.children.find(child => child.data.san == steps[0])
	for (let i = 1; i < steps.length; i++) {
		const step = steps[i];
		current = current?.children.find(child => child.data.san == step);
	}	
	// current.data = f(current);
	current.data = f(current);
	console.log(current.data.san);
	console.log(subrep.moves.children[0].children[0].children[0])
}

// const callback = (target: Node<PgnNodeData>) => {
// 	console.log("test");
// 	return {
// 		...target,
// 		training: {
// 			"test": "test"
// 		}
// 	}
// }