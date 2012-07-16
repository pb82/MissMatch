/**
 * MissMatch (v0.1)
 * ---------------------------------------------------------------------
 *
 * A pattern matcher for JavaScript. You can match any kind of JavaScript
 * values against patterns. Patterns can be arbitrarily nested which lets
 * you match against all types of nested arrays and objects.
 *
 * Example Usage:
 *
 * mm.match(candidateObj, {
 *  'o(.x@x, .y@y)' : function () { return this.x * this.y },
 *  'a(n@x, n@y)'   : function () { return this.x * this.y },
 *    ...
 * });
 */

mm = {};

/**
 * makeParser
 * generates a new parser from a pattern. A parser transformes a pattern
 * into an Abstract Syntax Tree that can be compiled to a matcher
 * function.
 *
 * Usage:
 * var AST = makeParser('o(.x, .y)').parse()
 * --> creates an AST that can be compiled into a matcher function which
 * in turn can recognize objects with at least the two  properties
 * x and y.
 */

/*--------------------------------------------------------------------*/
mm.makeParser = function (src) {
  "use strict";
  var index = 0;

  /**
   * Match valid JavaScript variable names. Only letters are allowed
   * at the moment. I know this is VASTLY incomplete.
   * TODO: find a better validation.
   *
   * Here's a nice character table:
   * http://www.net-comber.com/charset.html
   */
  function validChar(c) {
    var code = c.charCodeAt(0);
    return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
  }

  /**
   * Match valid JS object property names. Like variable names
   * this is incomplete.
   * TODO: A better validation has to be found.
   */
  function validProp(c) {
    return validChar(c)
      || (c === '_')
      || ((c.charCodeAt(0) >= 47) && (c.charCodeAt(0) <= 57));
  }

  /**
   * Match characters that are valid for numeric expressions.
   */
  function validNum(c) {
    var code = c.charCodeAt(0), result = true;
    return (code >= 48 && code <= 57)
      || (code === 46)  // '.'
      || (code === 45)  // '-'
      || (code === 43)  // '+'
      || (code === 101) // 'e'
  }

  /**
   * Typical parser helper functions.
   */
  function next() { return src[index++]; }
  function hasNext() { return index < src.length; }
  function consume() { index ++; }
  function peek() { return src[index]; }
  function clear() { while(peek() === ' ') { consume(); } }
  function match(t) { return t === next(); }

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
   * Parses @ bindings. (Patterns bound to variables that are available
   * in the handler function if the pattern matches).
   * e.g. 'n@x' matches a numeric value and binds it to 'x'.
   */
  function parseBinding(node) {
    consume(); // consume '@'
    var binding = [];

    while (hasNext()) {
      if (validChar(peek())) {
        binding.push(next());
      } else {
        break;
      }
    }

    binding = binding.join('');

    if (binding.length > 0) {
      node.binding = binding;
    } else {
      throw "No binding name given at " + index + " for " + node.type;
    }
  }

  /**
   * Parses the (...) component of an array pattern.
   */
  function parseArrayList(node) {
    consume(); // '('

    while (true) {
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
      else {
        consume(); // ','
      }
    }
  }

  function parseArray(AST) {
    consume(); // 'a'

    var rest, node;
    node = newNode('array', AST);

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

      /**
       * Check if the rest of the array
       * is matched against.
       */
      if(peek() === '|') {
        consume();
        rest = newNode('rest', node.nodes);
        /**
         * Check if the rest argument is bound
         * to a name.
         */
        clear();
        if(peek() === '@') {
          parseBinding(rest);
          clear();
        }
      }

      /**
       * Ensure that the array pattern is correctly
       * terminated (with a closing parentheses).
       */
      if(!match(')')) {
        throw "Unexpected token at index " + index + " expected: ')'";
      } else {
        /**
         * The array pattern might be bound to a name.
         */
        if(hasNext() && peek() === '@') {
          parseBinding(node);
        }
      }
    }
  }

  /**
   * Parse a single property. Valid property names can contain
   * upper- and lowercase lettern, _ and numbers.
   */
  function parseProperty(node) {
    consume(); // '.'
    var name = [], property;

    while(validProp(peek())) {
      name.push(next());
    }

    name = name.join('');

    if(name.length > 0) {
      property = newNode('property', node.nodes);
      property.name = name;

      /**
       * Properties may have type specifiers. This is the way to go
       * to match nested objects.
       *
       * e.g. 'o(.coord:o(.x, .y))' matches objects like
       *  '{coord: {x: 5, y: 7} }'
       */
      if(hasNext() && peek() === ':') {
        consume();
        stage1(property.nodes);
      }

      /**
       * A property may of course have a binding.
       */
      if(hasNext() && peek() === '@') {
        parseBinding(property);
      }
    } else {
      throw "No property name given at " + index + " for " + node.type;
    }
  }

  /**
   * Parse the property list of an object:
   * the (.x, .y) component.
   */
  function parseProperties(node) {
    consume(); // '('

    while(true) {
      clear();
      /**
       * Properties always have to start with '.'
       * o(.x, .y) -> An object with at least the two
       * properties x and y.
       */
      if(peek() === '.') {
        parseProperty(node);
      } else {
        /**
         * Object properties must always be introduced with a '.'
         */
        throw "Unexpected token " + peek() + " where . was expected";
      }
      clear();

      if(peek() !== ',') {
        break;
      } else {
        consume(); // ','
      }
    }
  }

  function parseObject(AST) {
    consume(); // 'o'

    var node = newNode('object', AST);

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

     /**
       * Ensure that the object pattern is correctly
       * terminated (with a closing parentheses).
       */
      if(!match(')')) {
        throw "Unexpected token at index " + index + " expected: ')'";
      } else {
        /**
         * The array pattern might be bound to a name.
         */
        if(hasNext() && peek() === '@') {
          parseBinding(node);
        }
      }
    }
  }

  /**
   * Parse a list of literals. The type of literal is determined by
   * the second parameter: a function to parse a certain type
   * (string, numeric, boolean) of literals
   */
  function parseLiteralList(AST,parseFunction) {
    consume(); // '('

    while(true) {
      clear(); parseFunction(AST);
      clear();

      if(peek() !==  ',') {
        break;
      } else {
        consume(); // ','
      }
    }
  }

  /**
   * Parse string literals. String can be introduced with
   * 'string' or "string".
   */
  function parseStringLiteral(AST) {
    var literal = [], node, enclosing = next();

    if(!(enclosing === '"' || enclosing === "'")) {
      throw "Unexpected token "
        + enclosing
        + " where string was expected";
    }

    while(hasNext() && peek() !== enclosing) {
      literal.push(next());
    }

    consume(); // ' or "
    node = newNode('equals', AST);
    newNode(literal.join(''), node.nodes);
  }

  /**
   * Parse numeric literals like 1, 1.05, .05, 8e5...
   */
  function parseNumericLiteral(AST) {
    var literal = [], node, value;

    while(hasNext() && validNum(peek())) {
      literal.push(next());
    }

    value = parseFloat(literal.join(''));

    /**
     * Thanks to CMS's answer on StackOverflow:
     * http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
     */
    if(!isNaN(value) && isFinite(value)) {
      node = newNode('equals', AST);
      newNode(value, node.nodes);
    } else {
      throw "Unexpected token "
        + peek()
        + " where numeric was expected";
    }
  }

  function parseBooleanLiteral(AST) {
    var literal = [], node;

    function isLowerCase(c) {
      var code = c.charCodeAt(0);
      return code >= 97 && code <= 122;
    }

    while(hasNext() && isLowerCase(peek())) {
      literal.push(next());
    }

    literal = literal.join('');
    if(literal === 'true' || literal === 'false') {
      node = newNode('equals', AST);
      newNode(literal[0] === 't' ? true : false, node.nodes);
    } else {
      throw "Unexpected token "
        + peek()
        + " where boolean was expected";
    }
  }

  /**
   * Matches any of the one-character type descriptors
   * (n,s,b,f,_) and creates an AST node for them.
   * They are all treated the same.
   */
  function parseGeneric(AST,type) {
    consume(); // type descriptor
    var node = newNode(type,AST);

    /**
     * A literal (or list of literals) may be specified
     * in parentheses after the type descriptor.
     */
    if(peek() === '(') {
      switch(type) {
        case "string":
          parseLiteralList(node.nodes, parseStringLiteral);
          break;
        case "numeric":
          parseLiteralList(node.nodes, parseNumericLiteral);
          break;
        case "boolean":
          parseLiteralList(node.nodes, parseBooleanLiteral);
          break;
      }

      node.type = 'or';
      consume(); // ')'
    }

    if(peek() === '@') {
      parseBinding(node);
    }
  }

  /**
   * Parser entry point. any expression must start
   * with either a type descriptor or a literal.
   */
  function stage1(AST) {
    if(hasNext()) {
      switch (peek()) {
        case 'a':
          parseArray(AST);
          break;
        case 'o':
          parseObject(AST);
          break;
        case 'n':
          parseGeneric(AST,'numeric');
          break;
        case 's':
          parseGeneric(AST,'string');
          break;
        case 'b':
          parseGeneric(AST,'boolean');
          break;
        case 'f':
          parseGeneric(AST,'function');
          break;
        case '_':
          parseGeneric(AST, 'any');
          break;
        default:
          throw "Unexpected token at " + index + " : " + peek();
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
      /**
       * Clear trailing whitespace
       */
      clear();

      if(index !== src.length) {
        throw "Expected end of input but tokens found: " + index;
      }
      return AST;
    }
  };
};
/*--------------------------------------------------------------------*/

/**
 * makeCompiler
 * generates a matcher function from a previously generated AST.
 * The matcher function will match input and store bound variables.
 *
 * The compiler does not generate JavaScript Code and does not require
 * any use of 'eval'. It uses currying to build predicate functions
 * that take other predicate functions as arguments that take other...
 *
 * The result is a kind of 'function tree' that can be executed.
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
  function curry(fun, args, asArray) {
    return function () {
      var this_args = Array.prototype.slice.call(arguments);
      return fun.apply(
        bindingContext, (asArray ? args : [args]).concat(this_args)
      );
    };
  }

  /**
   * Thanks to Kangax for the isArray function.
   * http://perfectionkills.com/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
   */
  function isArray(o) {
    return Object.prototype.toString.call(o) === '[object Array]';
  }

  /**
   * bind acts like a predicate but it also binds a variable to a
   * name and puts it in the binding context. The parameters are:
   * n: the binding name
   * p: the actual predicate associated with this binding
   * v: the value that this function is executed on.
   *
   * The first two parameters have to be parameterized by
   * the comiler (curry). The fourth parameter is passed at
   * runtime.
   */
  function bind(n,p,v) {
    var m = p(v);
    if(m.result) {
      bindingContext[n] =
        m.obj ? m.obj[m.param] : m.param;
    }

    /**
     * Sometimes we have to alter the binding value after executing
     * bind. For example when the rest of an array is matched. At bind
     * time the rest of the array is not known. So we store the
     * name of the binding that can later be retrieved from the
     * bindingContext.
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

  /* matches exactly the same value */
  function equals(x,o) {
    return {
      result: x === o,
      param: x
    };
  }

  /* matches a value that is typeof 'type' */
  function typePredicate(type,x) {
    return {
      result: typeof x === type,
      param: x
    };
  }

  /**
   * Tests wether an object has a given property. It uses hasOwnProperty
   * to do that. So the prototype chain is not considered.
   * TODO: Is this good or bad and should we change this?
   *
   * The arguments are:
   * m: (optional) type predicate
   * x: the name of the property
   * o: the object to test (this is passed at runtime)
   */
  function hasProperty(m,x,o) {
    var result = o.hasOwnProperty(x);
    if(m.length) {
      /**
       * [0] because a property can only be characterized by
       * one type descriptor.
       */
      result = result && m[0](o[x]).result;
    }

    return {
      result: result,
      param: x,
      obj: o
    };
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

    if(m.length) {
      for(index=0;index<m.length;index++) {
        if(result && m[index](o).result) {
          result.result = true;
          break;
        }
      }
    }

    return result;
  }

  // TODO: refactor, beatify this function.
  function matchArray(m,a) {
    var result = {
      result: false,
      param: a
    },
    from = 0,
    rest = false,
    restBindingResult,
    index,
    matcher,
    item,
    matchResult,
    restOfArray = [],
    i;

    if (!isArray(a)) {
      return result;
    }

    /**
     * If there are more predicates than array items, this
     * can't match.
     */
    if (m.length > a.length) {
      return result;
    }

    /**
     * If there are no predicates at all, this matches.
     * Because we have already ensured that it is a valid array.
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
       * it might be hidden behind a 'bind' quasi-predicate.
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
        restOfArray.push(a[i]);
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

    if(isArray(o)) {
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

  /**
   * Compiles a single subnode of the AST. This one is recursively
   * called.
   */
  function compileNode(ast) {
    var result = [], index, node, matcher;

    for(index=0;index<ast.length;index++) {
      node = ast[index];

      switch(node.type) {
        case 'array':
          matcher = curry(matchArray, compileNode(node.nodes), false);
          break;
        case 'object':
          matcher = curry(matchObject, compileNode(node.nodes), false);
          break;
        case 'property':
          matcher = curry(hasProperty,
            [compileNode(node.nodes), node.name ], true);
          break;
        case 'numeric':
          matcher = curry(typePredicate, ['number'], true);
          break;
        case 'string':
          matcher = curry(typePredicate, ['string'], true);
          break;
        case 'boolean':
          matcher = curry(typePredicate, ['boolean'], true);
          break;
        case 'function':
          matcher = curry(typePredicate, ['function'], true);
          break;
        case 'equals':
          matcher = curry(equals, [node.nodes[0].type], true);
          break;
        case 'or':
          matcher = curry(or, compileNode(node.nodes), false);
          break;
        case 'any':
          matcher = any;
          break;
        case 'rest':
          matcher = rest;
          break;
        default:
          throw "Unknown AST entity: " + node.type;
      }

      /**
       * The pattern must be bound to a name: we achieve this by
       * currying the matcher function into the bind function as
       * an argument.
       */
      if (node.binding) {
        matcher = curry(bind, [node.binding, matcher], true);
      }

      result.push(matcher);
    }

    return result;
  }

  return {
    compile: function () {
      var match_function = compileNode(AST)[0];

      return function (obj) {
        /**
         * Be sure to start with an empty binding context every
         * time the pattern function is executed.
         */
        bindingContext = {};
        return {
          result: match_function (obj).result,
          context: bindingContext
        };
      };
    }
  };
}
/*--------------------------------------------------------------------*/

mm.match = (function () {
  "use strict";
  var buffer = {}, match_function, AST, result,
  handler;

  function match(candidate, patterns) {
    var pattern, result;
    for (pattern in patterns) {
      if(patterns.hasOwnProperty(pattern)) {

        if (buffer.hasOwnProperty(pattern)) {
          match_function = buffer[pattern];
        }

        else {
          AST = mm.makeParser(pattern).parse();
          match_function = mm.makeCompiler(AST).compile();
          buffer[pattern] = match_function;
        }

        result = match_function (candidate);
        if(result.result) {
          handler = patterns[pattern];
          if (typeof handler === 'string') {
            handler = new Function (handler);
          }

          return handler.call(result.context);
        }
      }
    }

    /**
     * No patterns matched. In this case we throw an exception. You
     * can always prevent this with catching '_'.
     */
     throw "Non-exhaustive patterns";
  }

  return function (c,p) {
    return match(c,p);
  };
})();

mm.compile = function (p) {
  var AST = mm.makeParser(p).parse();
  return mm.makeCompiler(AST).compile();
};

mm.matchJSON = function (c,p) {
  return mm.match(JSON.parse(c), p);
};

var commonjs = typeof window === 'undefined' && exports;
if (commonjs) {
  exports.match = mm.match;
  exports.matchJSON = mm.matchJSON;
  exports.compile = mm.compile;
}
