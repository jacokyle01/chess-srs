import { ChildNode, Game, PgnNodeData } from 'chessops/pgn';

export type Color = 'white' | 'black';
export type Method = 'recall' | 'learn';
export type TrainingOutcome = 'success' | 'alternate' | 'failure';

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
    //TODO fen?
  };
}

export interface Subrepertoire<T> extends Game<T> {
  meta: {
    trainAs: Color;
    nodeCount: number;
    bucketEntries: number[];
    //all unseen nodes can be derived from:
    //nodeCount - sum(bucketEntries)
  };
}

export type Path = ChildNode<TrainingData>[];

export interface QueueEntry {
  path: Path;
  layer: number;
}

export interface Context {
  clone(): Context;
}

export interface PathContext {
  path: string;
  clone(): PathContext;
}
