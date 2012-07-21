
/**
 * Basic example to show the usage of MissMatch
 */

var mm = require('missmatch');

function match(x) {
  
  return mm.match(x, {
    
    'a(n@a,n@b)': function () {
      return "The argument was an array, containing two numbers: " 
        + this.a + " and "
        + this.b
    },
    
    'n(1,2,3)@actual': function () {
      return "The argument was a number, either 1, 2 or 3. (actually "
        + this.actual
        + ")";
    },
    
    'a': function () {
      return "The argument was an array.";
    },
    
    'n': function () {
      return "The argument was a number";
    },
    
    'o(.inner:o(.x:s@x))': function () {
      return "This argument was an object, containing a property "
      + "'inner' which also is an object. 'inner' contains the property"   
      + "'x' which is required to be a string and has the value: " + this.x;
    }

  });
  
}

console.log(match([]));
console.log(match(12));
console.log(match([4,2]));
console.log(match(2));
console.log(match({inner: {x: "hello pattern matching!"}}));
