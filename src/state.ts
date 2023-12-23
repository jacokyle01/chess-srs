import { PgnNodeData, Node, Game } from "chessops/pgn";
import { TrainingData } from "./util";

export interface State {
    count: number;
    currentNode: Node<TrainingData> | null;
    repertoire: Game<TrainingData>[];
    subrepertoire: Game<TrainingData>;
    time: number;
    trainingOrder: Node<TrainingData>[] | null; //obtain this by filtering the subrepertoire tree
}