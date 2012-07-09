MissMatch
=========

A pattern-matcher for JavaScript. It allows you to match any kind of
JavaScript value against patterns, bind values to names and execute
handler functions, when a pattern matches  

Patterns are composed in a simple and concise syntax:  

  - 'a' means array
  - 'o' means object
  - 'n' means numeric
  - 's' means string
  - 'b' means boolean
  - 'f' means function
  - '|' means the rest of a list
  - '_' means wildcard (match anything)


Patterns can of course be nested:
---------------------------------

  - a(n, n) matches an array with exactly two numbers(e.g. [1,2]).  
  
  - a(a, a(n)) matches an array that is composed of two nested arrays.  
    The second array is required to contain exactly one number.  
  
  - a(a, o(.x, .y)) matches an array that is composed of an array  
    and then an object. The object is required to contain at least  
    the two properties 'x' and 'y'.  


Patterns can also be bound to variables:
--------------------------------- 

  - a(n@x, n@y) matches an array that is composed of exactly two numbers  
    where the first one is bound to the variable 'x' and the second one  
    to 'y'. This can be used in the handler function for a pattern:  
    
```  js
missmatch(candidate, {   
...   
'a(n@x, n@y)': function () { return this.x * this.y; },  
...   
});  

```
    
Object patterns can have type specifiers:
-----------------------------------------

  - o(.x:n) matches an object with at least a property 'x' which is  
    required to be a number. You can also bind the number value:  
    
      o(.x:n@x)  
      
  - o(.coord:o(.x:n@x, .y:n@y)) matches an object that has (at least) a  
    property 'coord'. 'coord' further required to be an object an provide  
    (at least) the properties 'x' and 'y'. They are then bound to  
    variables and can be used in the handler function.  
    

Patterns can contain string literals:
-------------------------------------

  - '"a_str"' matches the string "a_str". Note that the double-quotation  
    is required.  
    
  - a('a_str') matches an array, that contains excatly one item which is  
    required to be a string with the value 'a_str'.  
    
    
The rest of an array can also be matched (and bound):
-----------------------------------------------------

  - a(n,n,n|) matches an array that is required to contain at least  
    three numeric values, but may also contain more.  
    
  - a(n,n,n|@r) matches the same array, but binds the rest (everything  
    but the first three items) to the variable 'r'.  


Version History:  

  - 0.1: Initial Release.  
