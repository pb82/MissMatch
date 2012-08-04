function thunk (f,a) {
  return function () {
    return f.apply(this, a);
  }
}

describe("Basic tests (module integrity)", function() {
  it("should exist and be available", function() {
    expect(typeof mm.match)
      .toBe('function');
      
    expect(typeof mm.matchJSON)
      .toBe('function');
      
    expect(typeof mm.compile)
      .toBe('function');     
      
    expect(mm.match(mm, {
      'o(.match:f@m, .matchJSON:f, .compile:f)': function () {
        return typeof this.m === 'function';
      }
    })).toBe(true);
  });  
});

describe("Simple pattern tests", function() {
  it("should recognize basic types", function() {          
    
    expect(typeof mm.compile("a")).toBe('function');
    expect(typeof mm.compile("o")).toBe('function');
    expect(typeof mm.compile("n")).toBe('function');
    expect(typeof mm.compile("s")).toBe('function');
    expect(typeof mm.compile("f")).toBe('function');
    expect(typeof mm.compile("b")).toBe('function');
    expect(typeof mm.compile("_")).toBe('function');

    expect(mm.match(1, { 
      'n@n': "return this.n" 
    })).toBe(1);
      
    expect(mm.match('s', { 
      's@n': "return this.n" 
    })).toBe('s');
      
    expect(mm.match(true, { 
      'b@n': "return this.n" 
    })).toBe(true);
      
    expect(mm.match(function (x) {return x;}, { 
      'f@n': "return this.n" 
    })(1)).toBe(1);       
  });  
});

describe("Parser tests", function() {
  it("should correctly parse expressions", function() {          
    expect(thunk(mm.match, [false, { 
      'x': "return this.n" 
    }])).toThrow("Unexpected token at index 0 expected 'one of (a,o,n,s,b,f,d,r,_)' but found x");
      
    expect(thunk(mm.match, [false, { 
      'a(n,n': "return this.n" 
    }])).toThrow("Unexpected token at index 5 expected ')' but found ''");
      
    expect(thunk(mm.match, [false, { 
      'a n)': "return this.n" 
    }])).toThrow("Expected end of input but tokens found: n)");
  });  
});

describe("Literals test", function() {
  it("should recognize string, numeric and boolean literals", function() {          
    expect(mm.match("a_str", { 
      's("a_str")@n': "return this.n" 
    })).toBe("a_str");
      
    expect(mm.match("a_str", { 
      's("b_str", "a_str")@n': "return this.n" 
    })).toBe("a_str");    
    
    expect(mm.match("a_str", { 
      's("a_str", "b_str")@n': "return this.n" 
    })).toBe("a_str");        
    
    expect(mm.match("b_str", { 
      's("a_str", "b_str")@n': "return this.n" 
    })).toBe("b_str");    
            
    expect(mm.match("b_str", { 
      's("b_str", "a_str")@n': "return this.n" 
    })).toBe("b_str");    
            
    expect(thunk(mm.match, ["a_str", { 
      's("b_str", 1)@n': "return this.n" 
    }])).toThrow("Unexpected token at index 12 expected 'string' but found 1");      
      
    expect(thunk(mm.match, ["a_str", { 
      's("b_str", true)@n': "return this.n" 
    }])).toThrow("Unexpected token at index 12 expected 'string' but found t");        
    
    expect(mm.match("hello", { 
      's("hello", "world")@n': "return this.n + ' world'" 
    })).toBe("hello world");         

    expect(mm.match("e", { 
      's("a", "b", "c", "z", "e")@n': "return this.n" 
    })).toBe("e");         
    
    expect(mm.match("z", { 
      's("a", "b", "c", "z", "e")@n': "return this.n" 
    })).toBe("z");                         
      
    expect(thunk(mm.match, ["b", { 
      's("c", "d", "e")@n': "return this.n" 
    }])).toThrow("Non-exhaustive patterns");        
      
    expect(mm.match("a_b", { 
      's(  "a_b", "b"   ,  "c")@n': "return this.n" 
    })).toBe("a_b");            
    
    expect(mm.match("a", { 
      's(/[a-z]/)@n': "return this.n" 
    })).toBe("a");  
    
    expect(mm.match("abc", { 
      's("a", /[a-z]/, "b")@n': "return this.n" 
    })).toBe("abc");                   
                  
    expect(mm.match("z", { 
      's(/[a-x]/)@n': "return this.n",
      '_': "return false"
    })).toBe(false);
    
    expect(mm.match("z", { 
      's(/[a-x]/, "z")@n': "return this.n",
      '_': "return false"
    })).toBe("z");

    expect(mm.match("peter-braun@gmx.net", { 
      's(/^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/)@n': "return this.n",
      '_': "return false"
    })).toBe("peter-braun@gmx.net");

    expect(mm.match(["abbc","a"], { 
      'a(s(/ab*c/, /ab*c*/), s(/ab*c/, /ab*c*/))@n': "return this.n[1]"
    })).toBe("a");
                   
    expect(mm.match(5, { 
      'n(5)@n': "return this.n" 
    })).toBe(5);
      
    expect(mm.match(4, { 
      'n(1,2,3,4,5)@n': "return this.n" 
    })).toBe(4);
      
    expect(mm.match(1.5, { 
      'n(1,2,1.5,1)@n': "return this.n" 
    })).toBe(1.5);

    expect(mm.match(1.4999, { 
      'n(1, 2, 1.4999, 1)@n': "return this.n" 
    })).toBe(1.4999);
      
    expect(mm.match(8000, { 
      'n(1,  8e3)@n': "return this.n" 
    })).toBe(80*100);
      
    expect(mm.match(0.08, { 
      'n(1,  .08)@n': "return this.n" 
    })).toBe(8 / 100);
      
    expect(mm.match(0.04, { 
      'n(1,  +.04)@n': "return this.n" 
    })).toBe(4 / 100);

    expect(mm.match(-5000, { 
      'n(1,  -.5e4)@n': "return this.n" 
    })).toBe(-5000);

    expect(thunk(mm.match, ["4", { 
      'n(1,2,3,4,5)@n': "return this.n" 
    }])).toThrow("Non-exhaustive patterns");
    
    expect(thunk(mm.match, [1.49999, { 
      'n(1.49998)@n': "return this.n" 
    }])).toThrow("Non-exhaustive patterns");        
    
    expect(thunk(mm.match, [1.49999, { 
      'n(2e.3)@n': "return this.n" 
    }])).toThrow("Non-exhaustive patterns");        
        
    expect(thunk(mm.match, ["4", {
      'n(1,2,"3",4,5)@n': "return this.n" 
    }])).toThrow("Unexpected token at index 6 expected 'numeric' but found \"");
      
    expect(mm.match(true, { 
      'b(true)@n': "return this.n" 
    })).toBe(true);
      
    expect(mm.match(false, { 
      'b(false)@n': "return this.n" 
    })).toBe(false);
      
    expect(mm.match(false, { 
      'b(true,false)@n': "return this.n" 
    })).toBe(false);
      
    expect(mm.match(true, { 
      'b( true, true,  true  )@n': "return this.n" 
    })).toBe(true);
              
    expect(mm.match([true,false], { 
      'a(b(true)@a, b(false)@b)': "return this.a && this.b" 
    })).toBe(false);
    
    expect(mm.match({x:{y: true}}, { 
      'o(.x:o(.y:b(true)@n))': "return this.n" 
    })).toBe(true);
                                        
    expect(thunk(mm.match, [[false,true], { 
      'a(b(true)@a, b(false)@b)': "return this.a && this.b" 
    }])).toThrow("Non-exhaustive patterns");        
                                                        
    expect(thunk(mm.match, [false, { 
      'b(true)@n': "return this.n" 
    }])).toThrow("Non-exhaustive patterns");        
    
    expect(thunk(mm.match, [1, { 
      'n(,)@n': "return this.n" 
    }])).toThrow("Unexpected token at index 2 expected 'numeric' but found ,");        

    expect(thunk(mm.match, [false, { 
      'b(,)@n': "return this.n" 
    }])).toThrow("Unexpected token at index 2 expected 'boolean' but found ,");        

    expect(thunk(mm.match, ["b", { 
      's(,)@n': "return this.n" 
    }])).toThrow("Unexpected token at index 3 expected 'string' but found ,");        
    
    expect(mm.match(new Date(), { 
      'd': function () {return true;}
    })).toBe(true);
    
    expect(mm.match(new Date("2012"), { 
      'd("2012", "2013")': function () {return true;}
    })).toBe(true);
    
    expect(mm.match(new Date("2012"), { 
      'd("2012")': function () {return "2012";},
      'd("2013")': function () {return "2013";}      
    })).toBe("2012");
    
    expect(mm.match(new Date("2013"), { 
      'd("2012")@n': function () {return this.n.getFullYear();},
      'd("2013")@n': function () {return this.n.getFullYear();}      
    })).toBe(2013);

    expect(mm.match(new Date("2012"), { 
      'd("2012", "2013")@d': function () {return this.d.getFullYear();}
    })).toBe(2012);

    expect(mm.match(new Date("2013"), { 
      'd("2012", "2013")@d': function () {return this.d.getFullYear();}
    })).toBe(2013);

    expect(mm.match(new Date("2012/2/28"), { 
      'd("2012/2/28")@d': function () {return this.d.getFullYear();}
    })).toBe(2012);
    
    expect(mm.match(new Date(), { 
      'o': function () {return true;}
    })).toBe(true);
    
    expect(mm.match([new Date(), new Date("2011")], { 
      'a(d@d,d)': function () {return this.d.getFullYear();}
    })).toBe(new Date().getFullYear());

    expect(thunk(mm.match, [new Date("2013"), { 
      'd("2011", "2012")@n': "return this.n" 
    }])).toThrow("Non-exhaustive patterns");
    
    expect(thunk(mm.match, [new Date("xxxx"), { 
      'd("xxxx")@n': "return this.n" 
    }])).toThrow("Unexpected token at index 8 expected 'date' but found )");        
    
    expect(thunk(mm.match, [/a*/, { 
      's': "return this.n" 
    }])).toThrow("Non-exhaustive patterns");        

    expect(mm.match(/a*/, { 
      'r@r': function () {return this.r.test("aaa");}
    })).toBe(true);
    
    expect(mm.match(/a*b/, { 
      'r@r': function () {return this.r.test("aaa");}
    })).toBe(false);
  });  
});

describe("Array pattern tests", function() {
  it("should recognize arrays", function() {          
    var m = mm.match;
    var a = [1,2,[{x: 5}], 'string', function (x) { return x*x }];
    
    expect(m(a, {
      '_@a': function () {return this.a.length === 5} 
    })).toBe(true);
      
    expect(m(a, { 
      'a': 'return true' 
    })).toBe(true);     
      
    expect(m(a, { 
      'a(n,n|)': 'return true' 
    })).toBe(true);
      
    expect(m(a, { 
      'a(n,n,a,s,f)': 'return true' 
    })).toBe(true);    
      
    expect(thunk(m, [a, { 
      'a(n,n,s,a,f)': 'return true' 
    }])).toThrow("Non-exhaustive patterns");
      
    expect(m(a, { 
      'a(_,n@x,a(o@obj)|)': 'return this.obj.x * this.x' 
    })).toBe(10);
    
    expect(m(a, { 
      'a(n(1,2,3)@a, n(3,2,1)@b|)': 'return this.a * this.b' 
    })).toBe(2); 

    expect(m([1,2,3], {    
      'a(_|@r)': function () {
         return this.r[0] * this.r[1];
      }
    })).toBe(6);

    expect(m([[[[5]]]], {    
      'a(a(a(a(n@x))))': function () {
         return this.x;
      }
    })).toBe(5);
          
    expect(m([1,2,3], { 
      'a(n(1,2),n(1,2),n(1,2))': 'return true',
      '_': 'return false'
    })).toBe(false);   

    expect(m([1,2,2], { 
      'a(n(1,2),n(1,2),n(1,2))': 'return true',
      '_': 'return false'
    })).toBe(true);   

    expect(m([], { 
      'a()': 'return true' 
    })).toBe(true);   
    
    expect(m([1,2], { 
      'a()': 'return true',
      '_': 'return false'
    })).toBe(false);
    
    expect(m([1], { 
      'a()': 'return true',
      '_': 'return false'
    })).toBe(false);
     
    expect(m([], { 
      'a(n)': 'return true',
      '_': 'return false'
    })).toBe(false);

    expect(m([], { 
      'a()@n': 'this.n.push(1); return this.n.length;' 
    })).toBe(1);
         
    expect(m([2,3,4], { 
      'a(|@n)': 'return this.n[1];' 
    })).toBe(3);
    
    expect(m([2,3,4], { 
      'a(|)': 'return true;' 
    })).toBe(true);
    
    expect(m([2,3,4], { 
      'a(|)@a': 'return this.a.length;' 
    })).toBe(3);
    
    expect(m({x: [[1,2],[3,4,5]]}, { 
      'o(:x:a(a(|)@a,a(n,n@b,|)))': 'return this.a.length * this.b;' 
    })).toBe(8);

    expect(thunk(m, [[], { 
      'a(,)': 'return true' 
    }])).toThrow("Unexpected token at index 2 expected 'one of (a,o,n,s,b,f,d,r,_)' but found ,");
    
  });  
});

describe("Object pattern tests", function() {
  it("should recognize objects", function() {          
    var obj = {
      an_array: [3,4,5,6,7],
      prop_a: "test",
      prop_b: 42,
      prop_c: {
        coord_a: {
          x: 4,
          y: 3
        },
        coord_b: {
          x: 5,
          y: 27
        }
      }
    };
    
    function Construct() {
      this.name = "name";
      this.size = 4;
    }
    
    Construct.prototype.hidden = "hidden";
    Construct.prototype.hiddenObj = {
      fun: function () {
        return 42;
      }
    }
    
    var obj2 = new Construct(); 
    
    expect(mm.match(obj, {
      "o(.an_array:a(n@v|))": function () { return this.v; }
    })).toBe(3);    
    
    expect(mm.match(obj, {
      "o(.an_array:a(n|@r))": function () { return this.r.length; }
    })).toBe(4);    
    
    expect(mm.match(obj, {
      "o(.prop_a@v)": function () { return this.v; }
    })).toBe("test");    
    
    expect(mm.match(obj, {
      "o(.prop_b@v)": function () { return this.v; }
    })).toBe(42);    
    
    expect(mm.match(obj, {
      "o(.prop_c@v)": function () { return typeof this.v; }
    })).toBe(typeof {});    
    
    expect(mm.match(obj, {
      "o(.prop_c:o(.coord_a:o(.x@x, .y@y)))": 
        function () { return this.y * this.x; }
    })).toBe(12);  
    
    expect(mm.match(obj, {
      "o(.prop_c:o(.coord_b:o(.y@y, .x@x)))": 
        function () { return this.y * this.x; }
    })).toBe(135);    
        
    expect(mm.match(obj2, {
      "o(.name:s@s)": 
        function () { return this.s; }
    })).toBe("name");
        
    expect(mm.match(obj2, {
      "o(.name@s)": 
        function () { return this.s; }
    })).toBe("name");

    expect(mm.match(obj2, {
      "o(:hidden@s)": 
        function () { return this.s; }
    })).toBe("hidden");

    expect(mm.match(obj2, {
      "o(:name:s@s)": 
        function () { return this.s; }
    })).toBe("name");

    expect(mm.match(obj2, {
      "o(:hiddenObj:o(.fun:f@f))": 
        function () { return this.f(); }
    })).toBe(42);

    expect(mm.match(obj2, {
      "o(.size@n, :hidden@h)": 
        function () { return this.h + this.n; }
    })).toBe("hidden4");
    
    expect(mm.match("string", { 
      'o': function () {return true;},
      '_': function () {return false;}
    })).toBe(false);

    expect(mm.match(3, { 
      'o': function () {return true;},
      '_': function () {return false;}
    })).toBe(false);

    expect(mm.match(false, { 
      'o': function () {return true;},
      '_': function () {return false;}
    })).toBe(false);
    
    expect(mm.match(function() {return 1;}, { 
      'o': function () {return true;},
      '_': function () {return false;}
    })).toBe(false);
    
    expect(mm.match(obj2, {
      "o(.size@n, :b@h)": function () { return this.h + this.n; },
      "o(.c@n, :hidden@h)": function () { return this.h + this.n; },     
      "o(.size@n, :hidden@h)": function () { return this.h + this.n; }
    })).toBe("hidden4");

    expect(thunk(mm.match, [obj2, { 
      'o(.hidden@h)': function () { return this.h; }
    }])).toThrow("Non-exhaustive patterns");

    expect(thunk(mm.match, [{}, { 
      'o(.x': function () { return 1; }
    }])).toThrow("Unexpected token at index 4 expected ')' but found ''");    
    
    expect(thunk(mm.match, [{}, { 
      'o(,)': function () { return 1; } 
    }])).toThrow("Unexpected token at index 2 expected '. or :' but found ,");
    
    expect(thunk(mm.match, [{}, { 
      'o()': function () { return 1; } 
    }])).toThrow("Unexpected token at index 2 expected '. or :' but found )");    
  });  
});

describe("Algorithmic tests", function() {
  it("should work correct when called recursively", function() {
    // Fibonacci
    function fib (x) {
      return mm.match(x, {
        "n(0,1)@n": function () { 
          return this.n; 
        },
        
        "n@n": function () { 
          return fib(this.n-1)+fib(this.n-2); 
        }
      });
    }
    
    expect(fib(12)).toBe(144);  
    
    // Array reduction
    var arr = [{x:5,y:4},{x:3,y:7},{x:12,y:1},{x:3,y:13}];
    
    function square(l,res) {
      return mm.match(l, {
        "a(o(.x@x,.y@y)|@r)": function () { 
          res.push(this.x*this.y); return square(this.r, res); 
        },
          
        "a(o(.x@x,.y@y))": function () { 
          res.push(this.x*this.y); return res; 
        }
      });
    }
    
    function sum(a) {
      var sum = 0, index;
      for (index=0;index<a.length;index++) {
        sum = sum + a[index];
      }
      return sum;
    }
    
    expect(sum(square(arr, []))).toBe(92);
  });  
});

describe("JSON tests", function() {
  it("should be able to match JSON input", function() {
        
    expect(mm.matchJSON('{"x": 1, "y": 2}', {
      'o(.x@x, .y@y)': function () {
        return this.x * this.y;
      }
    })).toBe(2);
    
    
    expect(mm.matchJSON('{"x": [4,5], "y": {"z": "json" } }', {
      'o(.x@a, .y:o(.z:s("json")@s))': function () {
        return this.s === "json";
      }
    })).toBe(true);

  });  
});

describe("function argument tests", function() {
  it("should be able match against function arguments", function() {
      function plus() {
        return mm.matchArgs({
          'a(n@a, n@b)': function () { return this.a + this.b; },
          'a(s@a, s@b)': function () { return this.a + this.b; },
          'a(f@a, f@b)': function () { return this.a() + this.b(); },
          'a(b@a, b@b)': function () { return this.a && this.b; },          
          '_@a': function () { return this.a; }
        });
      }
      
      expect(plus(1,2)).toBe(3);
      expect(plus("a","b")).toBe("ab");
      expect(plus(true,true)).toBe(true);
      expect(plus(false,true)).toBe(false);      
      expect(plus(112)[0]).toBe(112);
      expect(plus(
        function () { return 30; }, 
        function () { return 31; }
      )).toBe(61);
      
      expect(plus("a", "b", "c").join('')).toBe("abc");
  });  
});


describe("compile tests", function() {
  it("should be able to compile patterns to a function", function() {
        
    var fun = mm.compile('a(_,n,s|)');
    var fail      = fun([1,2,3,4,5]).result;
    var success   = fun([1,2,'a','b','c']).result;

    expect(!fail && success).toBe(true);
  });  
});

describe("variable and property naming test", function() {
  it("should only accept correct variable names", function() {
    
    expect(typeof mm.compile("o@s")).toBe('function');          
    expect(typeof mm.compile("o@__s")).toBe('function');
    expect(typeof mm.compile("o@_s_")).toBe('function');
    expect(typeof mm.compile("o@$$s")).toBe('function');
    expect(typeof mm.compile("o@$s$")).toBe('function'); 
    expect(typeof mm.compile("o@$11")).toBe('function');
    expect(typeof mm.compile("o@a01")).toBe('function');
    expect(typeof mm.compile("o@_0_")).toBe('function');  
    expect(thunk(mm.compile, ['a@1__s'])).toThrow();
    expect(thunk(mm.compile, ['o(.x:n@1)'])).toThrow();
  });  
});
