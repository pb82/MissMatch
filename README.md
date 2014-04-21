MissMatch
=========

Powerful pattern matching for javascript. Can match any kind of javascript value against patterns, bind values and execute handlers when a pattern matches.

- License: MIT
- Contributions, Issue Reports & Suggestions welcome!

Simple and concise syntax
-------------------------

  - 'a' means array
  - 'o' means object
  - 'n' means numeric
  - 's' means string
  - 'S' means non-blank string
  - 'b' means boolean
  - 'f' means function
  - 'd' means date
  - 'r' means regular expression
  - '|' means the rest of a list
  - '_' means wildcard (match anything)


Basic usage
-----------

```
mm.match(<OBJECT>, {   
  <PATTERN>: <HANDLER>,
  ...
});

```

or (since 0.1.2)

```
mm.match(<OBJECT>, [   
  <PATTERN>, <HANDLER>,
  ...
]);
```
(the second approach has the advantage that patterns can be stored in variables)


Nested patterns
---------------

Patterns may be arbitrarily nested.

  - a(n, n) matches an array with exactly two numbers (e.g. [1,2]).  
  
  - a(a, a(n)) matches an array that is composed of two nested arrays. The second array is required to contain exactly one number.  
  
  - a(a, o(.x, .y)) matches an array that is composed of an array and then an object. The object is required to contain at least 
    the two properties 'x' and 'y'.  


Binding values
--------------

  - a(n@x, n@y) matches an array that is composed of exactly two numbers where the first one is bound to the variable 'x' and the second one
    to 'y'. They can be used in the handler function of the pattern:  
    
```  js
mm.match([2,3], {   
'a(n@x, n@y)': function () { return this.x * this.y; },
'_': function () { /* Match all */ }
});

```

__Note that bound variables must always be accessed using 'this' in the handler function.__


Returning values from a (matching) pattern
------------------------------------------

The right side of a pattern may be a function or any other value. If it is a function and the pattern matches, then the result of the function is returned.
If it is a non-function value and the pattern matches, then this value is returned. In earlier version (pre 0.1.0) only handler functions were allowed.

```  js
// Handler function
mm.match(42, {   
'n@x': function () { return this.x; }
});

// Return a value when the pattern matches
mm.match(42, {   
'n': 42
});

```


Matching objects
----------------

  - o matches any object.

  - o(.x) matches an object that is required to have a property namend 'x' which must belong to the object itself and must not be a part
    of the prototype chain.
    
  - o(:x) matches an object that is required to have a property named 'x' which may also be part of the prototype chain.
  
  - o(:x, .y) matches an object that is required to have (at least) two properties 'x' and 'y'. 'y' is required to belong to the object itself
    while 'x' may be part of the prototype cain.

Matching object properties by type
----------------------------------

  - o(.x:n) matches an object with at least a property 'x' which is required to be a number. You can also bind the number's value:  
    
      * o(.x:n@x)  
      
  - o(.coord:o(.x:n@x, .y:n@y)) matches an object that has (at least) a property 'coord'. 'coord' is further required to be an object and provide
    (at least) the properties 'x' and 'y'. They are then bound to variables and can be used in the handler function.  
    

Literals
--------

  Literals can be matched for strings, numbers, booleans and dates. Literals may also be bound to names.
  
  - n(121.5) denotes the numeric literal 121.5.
    
  - s("a_str") denotes the string literal 'a_str'.
  
  - s(/^a*/) requires the string to match the regular expression /^a*/.
  
  - b(true) denotes a boolean literal that only matches 'true' values.
  
  - d("2012/2/28") denotes the date literal '2012/2/28'. Every valid JavaScript date string is accepted in the pattern. Time information may also be specified: d("2012/03/01 02:03:45")
  

Literal lists
-------------
  
  - n(1,2,3) matches if one of the numbers 1, 2 or 3 occurs.
  
  - s("a", "b") matches if a string "a" or a string "b" occurs.
  
  - n(1,2,3)@x matches if one of the numbers 1, 2 or 3 occurs and binds the actual value to the variable 'x'.
  
  - d("2012/2/28", "2012/3/01") matches if one of the specified dates occur.
      
      
The rest of an array
--------------------

  - a(n,n,n|) matches an array that is required to contain at least three numeric values, but may also contain more.  
    
  - a(n,n,n|@r) matches the same array, but binds the rest (everything but the first three items) to the variable 'r'.
  
Note that the rest of an array (if there is a rest left to be matched) will always be an array itself even if there is only one item left
to match the rest to.


Matching the arguments of the enclosing function
------------------------------------------------

You can match against the calling function's arguments without passing the arguments object. It's a nice way to write dispatching or generic functions.
(deprecated as of 0.1.0)

```  js
function plus() {
  mm.matchArgs({
    // Function arguments are treated like arrays.
    // If we pass in two numbers, we ADD them:
    'a(n@a,n@b)': function () { return this.a + this.b; },
    
    // If we pass in two booleans we AND them:
    'a(b@a,b@b)': function () { return this.a && this.b; }    
  });
}

plus(2,4);          // 6 
plus(true, false);  // false
```

API
===

The API consists of four functions:
  
  - **match** takes a value to match and a JavaScript Object containing the patterns and handlers. If one of the patterns matches, then
    it's handler function is executed.
    
  - **matchJSON** is equivalent to match(JSON.parse(obj_to_match), {...})
  
  - **matchArgs** lets you match against the calling function's arguments. You don't have to pass the arguments object, only the patterns.
    Function arguments are matched like arrays.
  
  - **compile** compiles a single pattern (string) to a function. The function can be executed on some input value and will return an object
    with the properties 'result' and 'context'. If the pattern matched the input, 'result' will be true and 'context' will be an object containing
    all bindings.


Installation
============

MissMatch can be used in the Browser, with Node.js and possibly with other server-side JavaScript Engines like Rhino (haven't tested that yet).
It has no dependencies.

Browser
-------
```
<script type="text/javascript" src="/path/to/MissMatch.js"></script>
```

The functions 'match', 'matchJSON', ',matchArgs' and 'compile' are all bound to an object with the name 'mm'.

Node.js
-------

  - npm install missmatch
  - (optional) npm test missmatch

Version History
---------------
  - 0.1.2
    * patterns and handlers can be contained in an array
    * includes minified library
    * added gruntfile
    * available on bower

  - 0.1.1
    * can match non-blank strings (with S)

  - 0.1.0
    * Non-function handler arguments allowed
    * matchArgs is now deprecated

  - 0.0.5 (Bugfix release)
    * capital 'E' accepted in numeric expressions (e.g. 3E-5)
    * code revised

  - 0.0.4:
    * can match strings with regular expressions (e.g. s(/^a*/, /[0-9]*/)).
    * can match regular expression objects.
    * code revised.

  - 0.0.3:
    * improved performance.
    * can match function arguments nicely (matchArgs).
    * can match date objects.
    * version string added (mm.version).

  - 0.0.2: 
    * Can match properties in the prototype chain (with ':' instead of '.').
    * Better support for valid variable and property names ($, _ and numbers allowed).
    * Will throw an exception if the same name is bound multiple times. In 0.0.1 The value was silently overwritten.
    * Improved parser error messages.
    
  - 0.0.1: Initial Release.  
