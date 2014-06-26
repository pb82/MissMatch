/**
 * MissMatch (v0.1.2)
 * ---------------------------------------------------------------------
 */
var mm = { version: '0.1.2' };

/**
 * makeParser
 * generates a new parser for a pattern. A parser transforms a pattern
 * to an Abstract Syntax Tree that can be compiled to a matcher
 * function.
 *
 * Usage:
 * var AST = makeParser('o(.x, .y)').parse();
 */

/*--------------------------------------------------------------------*/
mm.makeParser = function (src) {
  "use strict";
  var index = 0;

  function next()     { return src[index++]; }
  function hasNext()  { return index < src.length; }
  function consume()  { index ++; }
  function peek()     { return src[index]; }
  function clear()    { while(peek() === ' ') { consume(); } }
  function once(i)    { var a=!i; return function () { return a==!i ? (a = !a) : !i } }
  function newNode(type,AST) {
    var node = {
      type: type,
      nodes: [],
      binding: false
    };

    AST.push(node);
    return node;
  }

  /**
   * Match valid JavaScript variable names. Letters, numbers (if not in 
   * first position), $ and _ are allowed.
   */
  function validChar(c,isFirst) {
    return isFirst ? /[a-zA-Z$_]/.test(c) : /[0-9a-zA-Z$_]/.test(c);
  }

   // Match characters that are valid for numeric expressions.
  function validNum(c) {
    return /[0-9eE\+\-\.]/.test(c);
  }

  // Default exception 
  function unexpectedTokenException (expected) {
    throw "Unexpected token at index " + index 
      + " expected '"+ expected +"' but found " 
      + (peek() || "''");
  }

  /**
   * Parses @ bindings. (Patterns bound to variables that are available
   * in the handler function if the pattern matches).
   * e.g. 'n@x' matches a numeric value and binds it to 'x'.
   */
  function parseBinding(node) {
    consume(); // '@'
    var binding = [], first = once(true);

    while (hasNext()) {
      if (validChar(peek(), first())) {
        binding[binding.length] = next();
      } else {
        break;
      }
    }

    if (binding.length > 0) {
      node.binding = binding.join('');
    } else {
      throw "No binding name given at " + index + " for " + node.type;
    }
  }

   // Parses the (...) component of an array pattern.
  function parseArrayList(node) {
    consume(); // '('

    // a() matches the empty list.
    if(peek() === ')') {
      node.type = '()';
      return;
    }

    while (true) {
      // The whole array may be matched with 'a(|)' or (preferably) 'a'.
      if(peek() === '|') { break; }
      /**
       * Use clear() to allow whitespace on certain locations:
       * (n,n@x), (n, n@x), ( n , n@x ) are all accepted.
       * (n, n @x) is not accepted: bindings do not allow
       * any whitespace.
       */
      clear(); stage1(node.nodes); clear();
      if(peek() !== ',') {
        break;
      }
      consume(); // ','
    }
  }

  function parseArray(AST) {
    var rest, node = newNode(next(), AST);

    if(hasNext()) {
      /**
       * Array may be matched by either
       * a@name: Array bound to name
       * a(...): Array pattern
       */
      switch(peek()) {
        case '@':
          parseBinding(node);
          return;
        case '(':
          parseArrayList(node);
          break;
        default:
          /**
           * Allow patterns like a(a) to match nested arrays without
           * binding them to names.
           */
          return;
      }

       // Rest of an array matched?
      if(peek() === '|') {
        rest = newNode(next(), node.nodes);
        clear();
        
        // Rest of an array bound to a name?
        if(peek() === '@') {
          parseBinding(rest);
          clear();
        }
      }

      // Ensure that there is a closing parentheses in a(...)
      if(peek() !== ')') {
        unexpectedTokenException(')');
      } else {
        consume(); // ')'
        // The whole array might be bound to a name.
        if(hasNext() && peek() === '@') {
          parseBinding(node);
        }
      }
    }
  }

  /**
   * Parse a single property. Valid property names can contain
   * upper- and lowercase letters, _, $ and numbers.
   */
  function parseProperty(node,proto) {
    consume(); // '.'
    var name = [], property, first = once(true);

    while(hasNext() && validChar(peek(), first())) {      
      name[name.length] = next();
    }

    if(name.length > 0) {
      property = newNode(proto ? ':' : '.', node.nodes);
      property.name = name.join('');

      /**
       * Properties may have type specifiers. This is the way to go
       * to match nested objects.
       *
       * e.g. 'o(.coord:o(.x, .y))' matches objects like
       *  '{coord: {x: 5, y: 7} }'
       */
      if(hasNext() && peek() === ':') {
        consume(); // '('
        stage1(property.nodes);
      }

      // The property value might be bound to a name
      if(hasNext() && peek() === '@') {
        parseBinding(property);
      }
    } else {
      throw "No property name given at " + index + " for " + node.type;
    }
  }

  // Parse the property list of an object pattern.
  function parseProperties(node) {
    consume(); // '('

    while(true) {
      clear();
      /**
       * Properties always have to start with '.' or ':'
       * o(.x, :y) matches an object with at least an owned property
       * 'x' and a owned or inherited property 'y'. 
       */
      if(peek() === '.') {
        parseProperty(node,false);  // own property
      } else if(peek() === ':') {
        parseProperty(node,true);   // prototype property
      } else {
        unexpectedTokenException('. or :');
      }
      clear();

      if(peek() !== ',') {
        break;
      }
      consume(); // ','
    }
  }

  function parseObject(AST) {
    var node = newNode(next(), AST);

    if(hasNext()) {
     /**
       * An object may be matched by either
       * o@name: Object bound to name
       * o(...): Object pattern
       */
      switch(peek()) {
        case '@':
          parseBinding(node);
          return;
        case '(':
          parseProperties(node);
          break;
        default:
          /**
           * Allow patterns like a(o) to match nested objects without
           * binding them to names.
           */
          return;
      }

      // Ensure that there is a closing parentheses in o(...)
      if(peek() !== ')') {
        unexpectedTokenException(')');
      } else {
        consume(); // ')'
         // The whole object might be bound to a name
        if(hasNext() && peek() === '@') {
          parseBinding(node);
        }
      }
    }
  }

  /**
   * Parse a list of literals. The type of literal is determined by
   * the second parameter: a function to parse a certain type
   * (string, numeric, boolean, date) of literals
   */
  function parseLiteralList(AST,parseFunction) {
    consume(); // '('

    while(true) {
      clear(); parseFunction(AST); clear();

      if(peek() !==  ',') {
        break;
      }
      consume(); // ','
    }
  }

  // String literals might start with ' or "
  function extractStringLiteral() {
    var literal = [], enclosing = next();

    if(!(enclosing === '"' || enclosing === "'")) {
      throw "Unexpected token at index " + index +
        " expected 'string' but found " + enclosing;
    }

    while(hasNext() && peek() !== enclosing) {
      literal[literal.length] = next();
    }

    consume(); // ' or "
    return literal.join('');
  }

  function extractRegex() {
    var literal = [];
    consume(); // '/'

    while(hasNext() && peek() !== '/') {
      literal[literal.length] = next();
    }

    consume(); // '/'
    return new RegExp(literal.join(''));
  }
  
  // A string literal list may contain strings or regular expressions.
  function parseStringLiteral(AST) {
    if(peek() === '/') {
      newNode(extractRegex(), newNode('r=', AST).nodes);
    } else {
      newNode(extractStringLiteral(), newNode('=', AST).nodes);
    }
  }

   // Parse numeric literals like 1, 1.05, .05, 8e5...
  function parseNumericLiteral(AST) {
    var literal = [], value;

    while(hasNext() && validNum(peek())) {
      literal[literal.length] = next();
    }

    value = parseFloat(literal.join(''));
    
    /**
     * Thanks to CMS's answer on StackOverflow:
     * http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
     */
    if(!isNaN(value) && isFinite(value)) {
      newNode(value, newNode('=', AST).nodes);
    } else {
        unexpectedTokenException('numeric');
    }
  }

  function parseBooleanLiteral(AST) {
    var literal = [], code, lc = /[a-z]/;

    while(hasNext() && lc.test(peek())) {
      literal[literal.length] = next();
    }

    literal = literal.join('');
    if(literal === 'true' || literal === 'false') {
      newNode(literal[0] === 't' ? true : false, newNode('=', AST).nodes);
    } else {
        unexpectedTokenException('boolean');
    }
  }
  
  function parseDateLiteral(AST) {
    var literal = extractStringLiteral(), date = new Date(literal);
        
    if(isNaN(date.getTime())) {
      unexpectedTokenException('date');
    } else {
      newNode(date, newNode('d=', AST).nodes);
    }
  }

   // Matches any of (a,o,n,s,b,f,d,r,_)
  function parseGeneric(AST,type) {
    var node = newNode(next(),AST);

    // Parse literal lists, e.g. s("a", "b", ...)
    if(peek() === '(') {
      switch(type) {
        case "s":
          parseLiteralList(node.nodes, parseStringLiteral);
          break;
        case "n":
          parseLiteralList(node.nodes, parseNumericLiteral);
          break;
        case "b":
          parseLiteralList(node.nodes, parseBooleanLiteral);
          break;
        case "d":
          parseLiteralList(node.nodes, parseDateLiteral);
          break;        
      }

      node.type = '||';
      consume(); // ')'
    }

    if(peek() === '@') { parseBinding(node); }
  }

  // Parser entry point
  function stage1(AST) {
    if(hasNext()) {
      switch (peek()) {
        case 'a':
          parseArray(AST);
          break;
        case 'o':
          parseObject(AST);
          break;
        default:
          if (/[nsSbfdr_]/.test(peek())) {
            parseGeneric(AST,peek());
          } else {
            unexpectedTokenException('one of (a,o,n,s,S,b,f,d,r,_)');
          }         
      }
    }
    return AST;
  }

  return {
    parse: function () {
      if(!src || !src.length) {
        throw "Cannot parse empty pattern";
      }

      var AST = stage1([]);
      // Clear trailing whitespace
      clear();

      if(index !== src.length) {
        throw "Expected end of input but tokens found: " + src.substring(index);
      }
      return AST;
    }
  };
};
/*--------------------------------------------------------------------*/

/**
 * makeCompiler
 * generates a matcher function from a previously generated AST.
 */

/*--------------------------------------------------------------------*/
mm.makeCompiler = function (AST) {
  "use strict";
  var bindingContext = {};

  /**
   * curry takes a function, and a partial list of arguments and returns
   * a function that can be executed with the rest of the arguments.
   *
   * --> var max = curry(Math.max, [2,5]);
   * --> max(4);
   * --> 5
   */
  function curry(fun, args) {
    return function (x) {        
      return fun.apply(bindingContext, args.concat([x]));
    };
  }

  /**
   * Thanks to Kangax for the isArray function.
   * http://perfectionkills.com/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
   */
  function is(o, type) {
    return Object.prototype.toString.call(o) === type;
  }

  /**
   * bind acts like a predicate but it also binds a variable to a
   * name and puts it in the binding context. The parameters are:
   * n: the binding name
   * p: the actual predicate associated with this binding
   * v: the value that this function is executed on.
   *
   * The first two parameters have to be parameterized by
   * the comiler (curry). The fourth parameter is passed in at
   * runtime.
   */
  function bind(n,p,v) {
    var m = p(v);
    if(m.result) {
       // Throw an exception if the same name is bound multiple times. 
      if(bindingContext.hasOwnProperty(n)) {
        throw "Name '" + n + "' is already used in another binding.";
      }
         
      bindingContext[n] = m.obj ? m.obj[m.param] : m.param;
    }

    /**
     * When the rest of an array is matched, the binding value has to
     * be changed after executing bind. Thats because at bind time the
     * rest of the array is not known. Therefore the name of the last
     * binding is stored and can be retrieved in the continuing function.
     */
    m.this_binding = n;
    return m;
  }

  /* Predicates */
  
  /* matches anything */
  function any(x) {
    return {
      result: true,
      param: x
    };
  }

  /* matches the rest of an array */
  function rest(x) {
    return {
      result: true,
      param: x,
      rest: true
    };
  }

  function matchEmptyArray(a) {
    return {
      result: a.length === 0,
      param: a
    };
  }

  /* matches exactly the same value */
  function equals(x,o) {
    return {
      result: x === o,
      param: x
    };
  }

  /* matches a value (o) against a regex (x) */
  function matchesRegex(x,o) {
    return {
      result: x.test(o),
      param: x
    };
  }

  /* matches exactly the same date object */
  function equalsDate(x,o) {
    return {
      result: x.getTime() === o.getTime(),
      param: x
    };
  }

  function matchInstanceOf(t,o) {
    return {
      result: is(o, t),
      param: o
    };
  }

  function matchType(t,o) {
    return {
      result: typeof o === t,
      param: o
    };
  }

  function matchNonBlankString(x) {
    return {
      result: typeof x === 'string' && x,
      param: x
    };
  }

  /**
   * Tests wether an object has a given property.
   *
   * The arguments are:
   * m: (optional) type predicate
   * x: the name of the property
   * o: the object to test
   * r: true if the property could be found, false if not.
   */
  function testProperty(m,x,o,r) {
    /**
      * If m.length is > 0, then an additional type descriptor 
      * for a property was specified. [0] because a property 
      * can only be characterized by one type descriptor.
      */
    return {
      result: m.length ? r && m[0](o[x]).result : r,
      param: x,
      obj: o
    };
  }
   
  /* Match a property that is owned by the object */
  function hasProperty(m,x,o) {
    return testProperty(m,x,o, o.hasOwnProperty(x));
  }

  /* Match a property somewhere in the prototype chain */
  function hasPrototypeProperty(m,x,o) {
    return testProperty(m,x,o, x in o);
  }

  /**
   * or takes a list of predicate functions (m) and executes them on
   * it's second parameter (o). If one of the predicates return true
   * then or returns true. Otherwise false.
   */
  function or(m,o) {
    var index, result = {
      result: false,
      param: o
    };

    for(index=0;index<m.length;index++) {
      if(m[index](o).result) {
        result.result = true;
        break;
      }
    }
    return result;
  }
  
  // m is an array of predicates, a is the array to match
  function matchArray(m,a) {
    var from = 0, rest = false, restBindingResult, index, matcher, item,
    matchResult, restOfArray = [], i, result = {
      result: false,
      param: a
    };

    /**
     * If this isn't an array or if there are more predicates than array 
     * items, this can't match.
     */
    if (!is(a, '[object Array]') || (m.length > a.length)) {
      return result;
    }

    /**
     * If there are no predicates at all, this matches because it is 
     * already ensured that argument a is an array.
     */
    if(m.length === 0) {
      result.result = true;
      return result;
    }

    for(index=0;index<a.length;index++) {
      matcher = m[index];
      item = a[index];

      if(!matcher) {
        return result;
      }

      matchResult = matcher(item);
      if(!matchResult.result) {
        return result;
      }

      /**
       * If the rest of an array is matched, the predicate will
       * return an object that has a'rest' parameter. We can't
       * recognize the rest predicate by it's function name, because
       * it might be hidden behind a 'bind' call.
       */
      if(matchResult.rest) {
        restBindingResult = matchResult;
        from = index;
        rest = true;
        break;
      }
    }

    if(rest && restBindingResult.this_binding) {
      for(i = from; i < a.length; i++) {
        restOfArray[restOfArray.length] = a[i];
      }
      bindingContext[restBindingResult.this_binding] = restOfArray;
    }
    
    result.result = true;
    return result;
  }

  function matchObject(m,o) {
    var result = {
      result: true,
      param: o
    },
    index;

    if(is(o, '[object Array]')) {
      result.result = false;
      return result;
    }

    if(typeof o !== 'object') {
      result.result = false;
      return result;
    }

    for(index=0;index<m.length;index++) {
      if(!m[index](o).result) {
        result.result = false;
        return result;
      }
    }
    return result;
  }
  
  // Compile a single level of the AST
  function compileNode(ast) {
    var result = [], index, node, matcher;

    for(index=0;index<ast.length;index++) {
      node = ast[index];

      switch(node.type) {
        case 'a':
          matcher = curry(matchArray, [compileNode(node.nodes)]);
          break;     
        case 'o':
          matcher = curry(matchObject, [compileNode(node.nodes)]);
          break;
        case '.':
          matcher = curry(hasProperty, [compileNode(node.nodes), node.name ]);
          break;
        case ':':
          matcher = curry(hasPrototypeProperty, [compileNode(node.nodes), node.name ]);
          break;
        case '=':
          matcher = curry(equals, [node.nodes[0].type]);
          break;
        case 'd=':
          matcher = curry(equalsDate, [node.nodes[0].type]);
          break;
        case 'r=':
          matcher = curry(matchesRegex, [node.nodes[0].type]);
          break;        
        case '||':
          matcher = curry(or, [compileNode(node.nodes)]);
          break;
        case 'n':
          matcher = curry(matchType, ['number']);
          break;
        case 's':
          matcher = curry(matchType, ['string']);
          break;
        case 'S':
          matcher = matchNonBlankString;
          break;
        case 'b':
          matcher = curry(matchType, ['boolean']);
          break;
        case 'f':
          matcher = curry(matchType, ['function']);
          break;      
        case '_':
          matcher = any;
          break;
        case '|':
          matcher = rest;
          break;          
        case '()':
          matcher = matchEmptyArray;
          break;
        case 'd':
          matcher = curry(matchInstanceOf, ['[object Date]']);
          break;     
        case 'r':
          matcher = curry(matchInstanceOf, ['[object RegExp]']);
          break;               
        default:
          throw "Unknown AST entity: " + node.type;
      }

      // Bind requested. Wrap the matcher function with a call to bind.
      if (node.binding) {
        matcher = curry(bind, [node.binding, matcher]);
      }

      result[result.length] = matcher;
    }
    return result;
  }

  return {
    compile: function () {
      var matchFunction = compileNode(AST)[0];
      
      return function (obj) {
        // Each pattern function call must start with an empty context.
        bindingContext = {};
        return {
          result: matchFunction (obj).result,
          context: bindingContext
        };
      };
    }
  };
};
/*--------------------------------------------------------------------*/
mm.target = (typeof window === 'undefined' && exports) ? exports : mm;
mm.target.version == mm.version;

mm.target.match = (function () {
  "use strict";
  var buffer = {}, matchFunction, AST, result, handler;

  // ['o', 42] => {o: 42}
  function arrayToObject(array) {
    var obj = {}, i;
    if (array.length % 2 !== 0) {
      throw "Missing handler for pattern";
    }
    
    for (i = 0; i < array.length; i+=2) {
      obj[array[i]] = array[i+1];
    }
    return obj;
  }

  function match(candidate, patterns) {
    // >=0.1.2: patterns and handlersmay also be supplied as array
    if (({}).toString.call(patterns) === '[object Array]') {
      patterns = arrayToObject(patterns);
    }
    
    var pattern, result;
    for (pattern in patterns) {        
      if(patterns.hasOwnProperty(pattern)) {
        if (buffer.hasOwnProperty(pattern)) {
          matchFunction = buffer[pattern];
        } else {
          AST = mm.makeParser(pattern).parse();
          matchFunction = mm.makeCompiler(AST).compile();
          buffer[pattern] = matchFunction;
        }

        result = matchFunction (candidate);
        if(result.result) {
          handler = patterns[pattern];
          return typeof handler === 'function'
            ? handler.call(result.context)
            : handler;
        }
      }
    }

    /**
     * An exceptions is thrown if no patterns matched. Can be prevented
     * by matching '_'.
     */
     throw "Non-exhaustive patterns";
  }

  return function (c,p) {
    return match(c,p);
  };
})();

mm.target.compile = function (p) {
  "use strict";
  return mm.makeCompiler(mm.makeParser(p).parse()).compile();
};

mm.target.matchJSON = function (c,p) {
  "use strict";
  return mm.match(JSON.parse(c), p);
};

mm.target.matchArgs = function (p) {
  "deprecated";
  var args = arguments.callee.caller.arguments;  
  return mm.match(Array.prototype.slice.call(args), p);
}
