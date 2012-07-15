/**
 * Test script to be executed with npm test missmatch.
 * Performs some basic tests and reports it to the user.
 */

var mm = require('missmatch');

console.log('MissMatch is installed: ', typeof mm === typeof {});

mm.match(mm, {
  'o(.match:f@m, .matchJSON:f, .compile:f)': function () {
    console.log('MissMatch functions available: ', 
      typeof this.m === 'function');
  }
});

mm.match([1,2,3], {
  'a(_|@r)': function () {
    var success = 
      this.r[0] * this.r[1] === 6
        ? 'works'
        : 'failed';
        
    console.log('Basic pattern test: ', success);
  }
});
