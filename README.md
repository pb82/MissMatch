MissMatch
=========

A pattern-matcher for JavaScript. It allows you to match any kind of JavaScript value (including arrays and objects) against patterns, bind values to names and execute 
handler functions, when a pattern matches. In general this is useful in cases where you receive some value but can't be sure how it is exactly composed. It might be
some nested array or object. Pattern matching lets you test your input against composition-patterns, decompose it and bind the properties you are interested to variables.
Patterns and handler functions are entered as JavaScript objects where patterns are the keys (strings) and handlers are the values (functions).

Patterns are composed in a simple and concise syntax:
-----------------------------------------------------

  - 'a' means array
  - 'o' means object
  - 'n' means numeric
  - 's' means string
  - 'b' means boolean
  - 'f' means function
  - '|' means the rest of a list
  - '_' means wildcard (match anything)


Patterns can be arbitrarily nested:
-----------------------------------

  - a(n, n) matches an array with exactly two numbers(e.g. [1,2]).  
  
  - a(a, a(n)) matches an array that is composed of two nested arrays. The second array is required to contain exactly one number.  
  
  - a(a, o(.x, .y)) matches an array that is composed of an array and then an object. The object is required to contain at least 
    the two properties 'x' and 'y'.  


Patterns can also be bound to variables:
----------------------------------------

  - a(n@x, n@y) matches an array that is composed of exactly two numbers where the first one is bound to the variable 'x' and the second one
    to 'y'. This can be used in the handler function for a pattern:  
    
```  js
mm.match(candidate, {   
'a(n@x, n@y)': function () { return this.x * this.y; },
'_': function () { /* Match all */ }
});  

```

###Note that bound variables must always be accessed using 'this'.
    
Object patterns can have type specifiers:
-----------------------------------------

  - o(.x:n) matches an object with at least a property 'x' which is required to be a number. You can also bind the number value:  
    
      * o(.x:n@x)  
      
  - o(.coord:o(.x:n@x, .y:n@y)) matches an object that has (at least) a property 'coord'. 'coord' is further required to be an object and provide
    (at least) the properties 'x' and 'y'. They are then bound to variables and can be used in the handler function.  
    

Patterns can contain literals:
------------------------------

  Literals can be matched for strings, numbers and booleans. Literals may also be bound to names.
  
  - n(121.5) denotes the numeric literal 121.5.
    
  - s("a_str") denotes the string literal 'a_string'.
  
  - b(true) denotes a boolean literal that only matches 'true' values.
  
  
  ###You can specify a literal list. The pattern will match if one of the literal matches.
  
  - n(1,2,3) matches if one of the number 1, 2 or 3 occurs.
  
  - s("a", "b") matches if a string "a" or a string "b" occurs.
  
  ###Even lists of boolean literals are possible:
  
  - b(true, false)
  
  However this equivalent to just writing 'b'.
    
    
The rest of an array can also be matched (and bound):
-----------------------------------------------------

  - a(n,n,n|) matches an array that is required to contain at least three numeric values, but may also contain more.  
    
  - a(n,n,n|@r) matches the same array, but binds the rest (everything but the first three items) to the variable 'r'.
  
Note that the rest of an array (if there is a rest left to be matched) will always be an array itself even if there is only one item left
to match the rest to.


API
===

The API consists mainly of three functions:
  
  - **match** takes a value to match and a JavaScript Objekt containing the patterns and handlers. If one of the patterns matches, then
    the result of it's handler is executed.
    
  - **matchJSON** is equivalent to match(JSON.parse(obj_to_match), {...})
  
  - **compile** compiles a single pattern (string) to a function. The function can be executed on some input value and will return an object
    with the properties 'result' and 'context'. If the pattern matched the input, 'result' will be true and 'context' will be an object containing
    all bindings.


Installation
============

Browser
-------

Just reference MissMatch.js. The functions 'match', 'matchJSON' and 'compile' are all bound to an object with the name 'mm'.

Node.js
-------

  - npm install missmatch
  - (optional) npm test missmatch

Version History:
----------------

  - 0.0.1: Initial Release.  
