/**
 * Demonstrating the use of 'compile' to build extractor functions.
 */

var mm = require('missmatch');

/**
 * A pattern to match the first two objects in a list
 */
var pattern = 'a(o(.x@x), o(.y@y)|)';

/**
 * Compile the pattern to a matching function.
 */
var extractor = mm.compile(pattern);

var list = [{x: 1, y: 2}, {x: 3, y: 4}, {x: 5, y: 6}];


var result = extractor(list);
if(result.result) {
  /**
   * The input matched the pattern. result.context contains all the
   * bound variables of the pattern and their values.
   */
  console.log("Product of [0].x * [1].y = ", 
    result.context.x * result.context.y);
}
