/**
 * A dispatcher function. It's behavior is determinded by it's input.
 * Shows the usage of matchArgs.
 */

var mm = require('missmatch');

function sumArray(array, init) {
  for(index=0;index<array.length;index++) {
    init += array[index];
  }
  return init;
}

function plus() {
  // Arguments are always matched as an array. When the function
  // argument itself is an array, then you can match it wich
  // 'a(a)'  
  return mm.matchArgs({
    // Two numbers passed in.
    'a(n@a,n@b)': function () {
      return this.a + this.b;
    },
    
    // Some numbers are passed in
    'a(n@a|@r)': function () {
      return sumArray(this.r, this.a);
    },

    // An array passed in.
    'a(a@a)': function () {
      return sumArray(this.a, 0);
    },
    
    // Two strings passed in
    'a(s@a,s@b)': function () {
      return this.a + this.b;
    },
    
    // Two booleans passed in
    'a(b@a,b@b)': function () {
      return this.a && this.b;
    }
    
    // ...
  });
}

console.log(plus(1,2));
console.log(plus(1,2,3,4,5));
console.log(plus([1,2,3,4,5,6]));
console.log(plus("Hello, ", "World"));
console.log(plus(true, false));

