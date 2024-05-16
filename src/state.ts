import { Node, Game, ChildNode } from 'chessops/pgn.js';
import { Method, Path, QueueEntry, Subrepertoire, TrainingData } from './types.js';

export interface State {
  currentNode: Node<TrainingData> | null;
  method: Method; //recall or learn
  learn: {
    //when variation is unsee
    by: 'depth' | 'breadth'; //how we find the next variation
    max: number; //dont look at variations after this many moves
  };
  recall: {
    //after a variation has already been seen //TODO: depth
    by: 'depth' | 'breadth';
    max: number;
  };
  buckets: number[]; //the "spaces" for spaced repetition. see "leitner system"
  promotion: 'most' | 'next'; //on recall success, //TODO most
  demotion: 'most' | 'next';
  path: Path | null; //current path we are training
  repertoire: Subrepertoire<TrainingData>[];
  index: number; // which subrepertoire are we training
  time: number;
  queue: QueueEntry[]; //a list of paths
}

export function defaults(): State {
  return {
    currentNode: null,
    method: 'learn',
    learn: {
      by: 'breadth',
      max: Infinity,
    },
    recall: {
      by: 'depth',
      max: Infinity,
    },
    buckets: [30, 86400, 259200, 604800, 1814400, 5443200, 16329600, 31536000], //30 seconds, 24 hours, 3 days, 7 days, 3 weeks, 9 weeks, 27 weeks, 1 year
    promotion: 'next',
    demotion: 'next',
    path: null,
    repertoire: [],
    index: -1,
    time: Math.round(Date.now() / 1000),
    queue: [],
  };
}
