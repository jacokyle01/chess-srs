import { PgnNodeData, Node, Game, ChildNode } from "chessops/pgn";
import { Method, TrainingData } from "./util";

export interface State {
    count: number;
    currentNode: Node<TrainingData> | null;
    groups: number[] //how long we should wait before training. see "leitner system"
    method: Method
    path: ChildNode<TrainingData>[] | null; //current path we are training
    repertoire: Game<TrainingData>[];
    subrepertoire: Game<TrainingData>;
    time: number;
    trainingOrder: Node<TrainingData>[] | null; //obtain this by filtering the subrepertoire tree
    queue: ChildNode<TrainingData>[][]; //a list of paths 

}