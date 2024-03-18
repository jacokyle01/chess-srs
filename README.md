# chess-srs

_chess-srs_ is a library with a fully-featured API to facilitate chess opening training with spaced repetition.

## Spaced repetition

### What is spaced repetition?

[Spaced repetition](https://en.wikipedia.org/wiki/Spaced_repetition) is a memorization technique that consists of _recalling_ something at increasingly longer intervals.

In other words, instead of memorzing something once a week, we can use implement spaced repetition to memorize it once, then three days later, then a week later, then a month later, etc...

### How can this help me learn my chess openings?

Instead of training at irregular intervals, this library provides software which is capable of being extended to provide a fully-managed solution for training openings.\
In other words, you won't have to remember when you trained a certain opening, or if a certain move is "due" for training.

## API

### Documentation

This library exposes a [fully-featured API](https://github.com/jacokyle01/chess-srs/blob/main/src/api.ts) for all necessary actions that a chess player may need to train his chess openings.\
All endpoints are documented with inline comments that describe their function.

## Usage

### NPM

_chess-srs_ is in the Node Package Registry! To import it, use\
`npm install chess-srs`

### Implementing it 

I've made some apps that implement a subset of this library's functionality.
- [On the command line](https://github.com/jacokyle01/chess-srs-cli)
- [As a Web app](https://github.com/jacokyle01/chess-prep)

