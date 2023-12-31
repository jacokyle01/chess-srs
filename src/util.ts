import { Game, transform} from "chessops/pgn";
import { PgnNodeData, Node, ChildNode, walk } from "chessops/pgn";

export interface TrainingData extends PgnNodeData {
	training: {
		seen: boolean,
		group: number,
		dueAt: number
	}
}



export type Method = "recall" | "learn";

interface Context {
	clone(): Context;
}

const context: Context = {
	clone() {
		const clonedCtx: Context = { ...this };
		return clonedCtx;
	},
};

const markUnseen = (ctx: Context, data) => {
	return {
		...data,
		training: {
			seen: false,
            group: -1,
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
    })
}

//function to find and modify node by path 
export const transformNode = (subrep: Game<PgnNodeData>, path: string, f: (target: Node<PgnNodeData>) => Node<PgnNodeData>) => {
	const steps = path.split(" ");
	console.log(steps);
	console.log(subrep.moves.children.find(child => child.data.san == steps[0])); 

	let current = subrep.moves.children.find(child => child.data.san == steps[0])
	for (let i = 1; i < steps.length; i++) {
		const step = steps[i];
		current = current?.children.find(child => child.data.san == step);
	}	
	current = current as ChildNode<PgnNodeData>
	current.data = f(current);
	console.log(current.data.san);
	console.log(subrep.moves.children[0].children[0].children[0])
}
//example usage: 

// const callback = (target: Node<PgnNodeData>) => {
// 	console.log("test");
// 	return {
// 		...target,
// 		training: {
// 			"test": "test"
// 		}
// 	}
// }


const checker = (data) => {
	return data.training.group == "unseen";
}

//get nodes such that f(node) = true 
export const getNodesAsList = (head: Node<TrainingData>): Node<TrainingData>[] => {
	let nodes: Node<TrainingData>[] = [];
	walk(head, context, (context, data) => {
		if (checker(data)) {
			nodes.push(data);
		}	
	})
	return nodes;
}

//debug
//print path as string of SANs
export const printPath = (path: ChildNode<TrainingData>[]): void => { 
	let string = "";
	for (const step of path) {
		string += step.data.san + " ";
	}
	console.log(string);
}

export function wait(ms) {
    var start = Date.now(),
        now = start;
    while (now - start < ms) {
      now = Date.now();
    }
}
