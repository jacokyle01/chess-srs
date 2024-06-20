/*
  ~~~ Basic tests ~~~ 

  -expected API usage 
  -default configuration 
  -initialization
  -subrepertoire meta

*/

import { expect, test } from '@jest/globals';
import { ChessSrs } from '../src/chessSrs.js';

/*
    subrepertoires:
    0   catalan
    1   kings gambit 
*/

const chessSrs = ChessSrs({ buckets: [100, 1000, 10000] });
const getNow = (): number => {
  return Math.floor(Date.now() / 1000);
};
const countUnseen = (nodes: number, buckets: number[]): number => {
  return nodes - buckets.reduce((x, y) => x + y, 0);
};

chessSrs.addSubrepertoires(
  '1. d4 d5 2. c4 e6 3. Nf3 Nf6 4. g3 Be7 5. Bg2 O-O 6. O-O dxc4 7. Qc2 a5 8. Qxc4 b6',
  'white'
);
chessSrs.addSubrepertoires(
  '1. e4 e5 2. f4 exf4 (2... d5) 3. Nf3 (3. Bc4 Qh4+ (3... d5) 4. Kf1) (3. d4 Qh4+ 4. Ke2) 3... d6 { test } (3... g5) *',
  'white'
);
chessSrs.load(0);
chessSrs.next();

test('test', () => {
  expect(chessSrs.countDue()).toBe(0);
});

test('not null', () => {
  expect(chessSrs.path()).not.toBeNull();
});

test('meta initialization', () => {
  expect(chessSrs.state.repertoire[0].meta.trainAs).toBe('white');
  expect(chessSrs.state.repertoire[0].meta.nodeCount).toBe(8);
  expect(chessSrs.state.repertoire[0].meta.bucketEntries).toEqual([0, 0, 0]);
});

test('count unseen', () => {
  const bucketEntries = chessSrs.state.repertoire[0].meta.bucketEntries;
  const allNodes = chessSrs.state.repertoire[0].meta.nodeCount;
  expect(countUnseen(allNodes, bucketEntries)).toBe(8);
});

test('succeed on moves', () => {
  expect(chessSrs.path()?.at(-1)?.data.san).toEqual('d4');
  chessSrs.succeed();
  chessSrs.next();

  expect(chessSrs.path()?.at(-1)?.data.san).toEqual('c4');
  expect(chessSrs.path()?.at(-1)?.data.fen).toEqual(
    'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 2'
  );
  chessSrs.succeed();
  chessSrs.next();
  expect(chessSrs.path()?.at(-1)?.data.san).toEqual('Nf3');
  expect(chessSrs.path()?.at(-1)?.data.training.dueAt).toEqual(Infinity);
  expect(chessSrs.path()?.at(-1)?.data.training.group).toEqual(-1);
  expect(chessSrs.path()?.at(-1)?.data.training.seen).toEqual(false);
  chessSrs.succeed();
});

test('test unseen', () => {
  const bucketEntries = chessSrs.state.repertoire[0].meta.bucketEntries;
  const allNodes = chessSrs.state.repertoire[0].meta.nodeCount;
  expect(countUnseen(allNodes, bucketEntries)).toBe(5);
});

test('bucket entries', () => {
  const bucketEntries = chessSrs.state.repertoire[0].meta.bucketEntries;
  expect(bucketEntries).toEqual([3, 0, 0]);
});

test('succeeds correctly', () => {
  while (chessSrs.next()) {
    chessSrs.succeed();
    expect(chessSrs.path()?.at(-1)?.data.training.group).toEqual(0);
    const now = Math.floor(Date.now() / 1000);

    //allow 10 seconds of execution time
    expect(chessSrs.path()?.at(-1)?.data.training.dueAt).toBeGreaterThan(getNow() + 90);
    expect(chessSrs.path()?.at(-1)?.data.training.dueAt).not.toBeGreaterThan(getNow() + 110);
  }
});

test('all nodes should be seen', () => {
  const bucketEntries = chessSrs.state.repertoire[0].meta.bucketEntries;
  const allNodes = chessSrs.state.repertoire[0].meta.nodeCount;
  expect(countUnseen(allNodes, bucketEntries)).toBe(0);
});

test('recall', () => {
  chessSrs.setMethod('recall');
  chessSrs.update(getNow() + 110);
  expect(chessSrs.countDue()).toBe(8);
  chessSrs.next();
  expect(chessSrs.path()?.at(-1)?.data.training.group).toEqual(0);
  expect(chessSrs.path()?.at(-1)?.data.san).toEqual('d4');

  //test guessing
  expect(chessSrs.guess('d4')).toEqual('success');
  expect(chessSrs.guess('f6')).toEqual('failure');
  chessSrs.succeed();

  while (chessSrs.next()) {
    chessSrs.succeed();
    expect(chessSrs.path()?.at(-1)?.data.training.group).toEqual(1);
    //allow 10 seconds of execution time
    expect(chessSrs.path()?.at(-1)?.data.training.dueAt).toBeGreaterThan(chessSrs.state.time + 990);
    expect(chessSrs.path()?.at(-1)?.data.training.dueAt).not.toBeGreaterThan(chessSrs.state.time + 1010);
  }
});
