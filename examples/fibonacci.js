/**
 * The classic Fibonacci example shows how to use pattern matching
 * with recursion involved.
 * 
 * This is meant to be executed in a CommonJS environment, e.g.
 * node.js
 */

var mm = require('missmatch');

function fib (x) {
  return mm.match (x, {
    // For 0 and 1 just return the value
    'n(0,1)@n': function () {
      return this.n;
    },
    
    // For all other numbers call fib recursively
    '_@n': function () {
      return fib(this.n-1) + fib(this.n-2);
    }
  });
}

console.log("Fibonacci value of 14 is: " + fib(14));
