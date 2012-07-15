/**
 * Test script to be executed with npm test missmatch.
 * Performs some basic tests and reports it to the user.
 */

var mm = require('missmatch');

var validationPattern = 'o(.match:f, .matchJSON:f, compile:f)';

console.log('MissMatch is installed: ' + typeof mm === typeof {});

mm.match(mm, {
  'o(.match:f@m, .matchJSON:f, compile:f)': function () {
    console.log('MissMatch functions available: ', typeof m === 'function');
  }
});

mm.match([1,2,3], {
  'a(_|@r)': function () {
    if(this.r[0] * this.r[1] === 6) {
      console.log('Basic pattern test: works');
    } else {
      throw "Basic pattern test failed.";
    }
  }
});
