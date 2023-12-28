import { PgnNodeData, Node, Game } from "chessops/pgn";
import { Method, TrainingData } from "./util";

export interface State {
    at: number //which position of training order we're at
    count: number;
    currentNode: Node<TrainingData> | null;
    groups: number[] //how long we should wait before training. see "leitner system"
    method: Method
    repertoire: Game<TrainingData>[];
    subrepertoire: Game<TrainingData>;
    time: number;
    trainingOrder: Node<TrainingData>[] | null; //obtain this by filtering the subrepertoire tree
    queue: Node<TrainingData>[][]; //a list of paths 

}