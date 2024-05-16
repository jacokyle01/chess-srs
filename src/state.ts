import { Node, Game, ChildNode } from 'chessops/pgn.js';
import { Method, Path, DequeEntry, Subrepertoire, TrainingData } from './types.js';

export interface State {
  currentNode: Node<TrainingData> | null;
  method: Method; //recall or learn
  getNext: {
    by: 'depth' | 'breadth'; // exploration strategy to find next position
    max: number; //dont look at positions after this many moves
  };
  buckets: number[]; //the "spaces" for spaced repetition. see "leitner system"
  promotion: 'most' | 'next'; //on recall success, //TODO most
  demotion: 'most' | 'next';
  path: Path | null; //current path we are training
  repertoire: Subrepertoire<TrainingData>[];
  index: number; // which subrepertoire are we training
  time: number;
}

export function defaults(): State {
  return {
    currentNode: null,
    method: 'learn',
    getNext: {
      by: 'breadth',
      max: Infinity,
    },
    buckets: [30, 86400, 259200, 604800, 1814400, 5443200, 16329600, 31536000], //30 seconds, 24 hours, 3 days, 7 days, 3 weeks, 9 weeks, 27 weeks, 1 year
    promotion: 'next',
    demotion: 'next',
    path: null,
    repertoire: [],
    index: -1,
    time: Math.round(Date.now() / 1000),
  };
}
