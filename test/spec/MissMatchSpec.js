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
  });  
});

describe("Simple pattern tests", function() {
  it("should recognize basic types", function() {          
    expect(mm.match(1, { 'n@n': "return this.n" }))
      .toBe(1);
      
    expect(mm.match('s', { 's@n': "return this.n" }))
      .toBe('s');
      
    expect(mm.match(true, { 'b@n': "return this.n" }))
      .toBe(true);
      
    expect(mm.match(function (x) {return x;}, { 'f@n': "return this.n" })(1))
      .toBe(1);       
  });  
});

describe("Parser tests", function() {
  it("should correctly parse expressions", function() {          
    expect(thunk(mm.match, [false, { 'x': "return this.n" }]))
      .toThrow("Unexpected token at 0 : x");
      
    expect(thunk(mm.match, [false, { 'a(n,n': "return this.n" }]))
      .toThrow("Unexpected token at index 6 expected: ')'");
      
    expect(thunk(mm.match, [false, { 'a n)': "return this.n" }]))
      .toThrow("Expected end of input but tokens found: 2");
  });  
});

describe("Literals test", function() {
  it("should recognize string, numeric and boolean literals", function() {          
    expect(mm.match("a_str", { 's("a_str")@n': "return this.n" }))
      .toBe("a_str");
      
    expect(mm.match("a_str", { 's("b_str", "a_str")@n': "return this.n" }))
      .toBe("a_str");    
    
    expect(mm.match("a_str", { 's("a_str", "b_str")@n': "return this.n" }))
      .toBe("a_str");        
    
    expect(mm.match("b_str", { 's("a_str", "b_str")@n': "return this.n" }))
      .toBe("b_str");    
            
    expect(mm.match("b_str", { 's("b_str", "a_str")@n': "return this.n" }))
      .toBe("b_str");    
            
    expect(thunk(mm.match, ["a_str", { 's("b_str", 1)@n': "return this.n" }]))
      .toThrow("Unexpected token 1 where string literal was expected");        
      
    expect(thunk(mm.match, ["a_str", { 's("b_str", true)@n': "return this.n" }]))
      .toThrow("Unexpected token t where string literal was expected");        
    
    expect(mm.match("hello", { 's("hello", "world")@n': "return this.n + ' world'" }))
      .toBe("hello world");         

    expect(mm.match("e", { 's("a", "b", "c", "z", "e")@n': "return this.n" }))
      .toBe("e");         
    
    expect(mm.match("z", { 's("a", "b", "c", "z", "e")@n': "return this.n" }))
      .toBe("z");                         
      
    expect(thunk(mm.match, ["b", { 's("c", "d", "e")@n': "return this.n" }]))
      .toThrow("Non-exhaustive patterns");        
      
    expect(mm.match("a_b", { 's(  "a_b", "b"   ,  "c")@n': "return this.n" }))
      .toBe("a_b");                   
            
    expect(mm.match(5, { 'n(5)@n': "return this.n" }))
      .toBe(5);
      
    expect(mm.match(4, { 'n(1,2,3,4,5)@n': "return this.n" }))
      .toBe(4);
      
    expect(mm.match(1.5, { 'n(1,2,1.5,1)@n': "return this.n" }))
      .toBe(1.5);

    expect(mm.match(1.4999, { 'n(1, 2, 1.4999, 1)@n': "return this.n" }))
      .toBe(1.4999);
      
    expect(mm.match(8000, { 'n(1,  8e3)@n': "return this.n" }))
      .toBe(80*100);
      
    expect(mm.match(0.08, { 'n(1,  .08)@n': "return this.n" }))
      .toBe(8 / 100);

    expect(thunk(mm.match, ["4", { 'n(1,2,3,4,5)@n': "return this.n" }]))
      .toThrow("Non-exhaustive patterns");
    
    expect(thunk(mm.match, [1.49999, { 'n(1.49998)@n': "return this.n" }]))
      .toThrow("Non-exhaustive patterns");        
      
    expect(thunk(mm.match, ["4", { 'n(1,2,"3",4,5)@n': "return this.n" }]))
      .toThrow('Unexpected token " where numeric was expected');
  });  
});

describe("Array pattern tests", function() {
  it("should recognize basic types", function() {          
    var m = mm.match;
    var a = [1,2,[{x: 5}], 'string', function (x) { return x*x }];
    
    expect(m(a, {'_@a': function () {return this.a.length === 5} }))
      .toBe(true);
      
    expect(m(a, { 'a': 'return true' }))
      .toBe(true);     
      
    expect(m(a, { 'a(n,n|)': 'return true' }))
      .toBe(true);
      
    expect(m(a, { 'a(n,n,a,s,f)': 'return true' }))
      .toBe(true);    
      
    expect(thunk(m, [a, { 'a(n,n,s,a,f)': 'return true' }]))
      .toThrow("Non-exhaustive patterns");
      
    expect(m(a, { 'a(_,n@x,a(o@obj)|)': 'return this.obj.x * this.x' }))
      .toBe(10);
    
    expect(m(a, { 'a(n(1,2,3)@a, n(3,2,1)@b|)': 'return this.a * this.b' }))
      .toBe(2);        
  });  
});
