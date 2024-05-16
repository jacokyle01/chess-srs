/*
  ~~~ Bucket entries ~~~ 

  Testing that bucket entries update correctly
*/

const INDEX = 0;

import { expect, test } from '@jest/globals';
import { ChessSrs } from '../src/chessSrs.js';

const getNow = (): number => {
  return Math.floor(Date.now() / 1000);
};
const chessSrs = ChessSrs({ buckets: [1, 10, 100], promotion: 'next', demotion: 'next' });
chessSrs.addSubrepertoires('1. e4 c5 (1... e5 2. Nf3 Nf6 (2... Nc6 3. Bb5) 3. Nxe5) 2. Nf3', 'white');
chessSrs.load(INDEX);

while (chessSrs.next()) {
  chessSrs.succeed();
}
test('all learnt', () => {
  expect(chessSrs.state.repertoire[INDEX].meta.bucketEntries).toEqual([5, 0, 0]);
});
chessSrs.setMethod('recall');
chessSrs.update(getNow() + 100);

test('two recalls', () => {
  for (let i = 0; i < 2; i++) {
    chessSrs.next();
    chessSrs.succeed();
  }
  expect(chessSrs.state.repertoire[INDEX].meta.bucketEntries).toEqual([3, 2, 0]);
});

test('promotion: most', () => {
  chessSrs.set({
    promotion: 'most',
  });
  while (chessSrs.next()) {
    chessSrs.succeed();
  }
  expect(chessSrs.state.repertoire[INDEX].meta.bucketEntries).toEqual([0, 2, 3]);
});

test('fail: next', () => {
  chessSrs.update(getNow() + 10000);
  chessSrs.next();
  chessSrs.fail();
  expect(chessSrs.state.repertoire[INDEX].meta.bucketEntries).toEqual([1, 1, 3]);
})

test('fail: most', () => {
  chessSrs.update(getNow() + 10000000);
  chessSrs.set({
    demotion: 'most',
  });
  while (chessSrs.next()) {
    chessSrs.fail();
  }
  expect(chessSrs.state.repertoire[INDEX].meta.bucketEntries).toEqual([5, 0, 0]);
})
