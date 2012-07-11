function thunk (f,a) {
  return function () {
    return f.apply(this, a);
  }
}

describe("Basic tests (module integrity)", function() {
  it("should exist and be available", function() {
    expect(typeof mm.match).toBe('function');
    expect(typeof mm.json).toBe('function');
    expect(typeof mm.compile).toBe('function');            
  });  
});

describe("Simple pattern tests", function() {
  it("should recognize basic types", function() {          
    expect(mm.match(1, { 'n@n': "return this.n" })).toBe(1);
    expect(mm.match('s', { 's@n': "return this.n" })).toBe('s');
    expect(mm.match(true, { 'b@n': "return this.n" })).toBe(true);
    expect(mm.match(function (x) {return x;}, { 'f@n': "return this.n" })(1)).toBe(1);      
  });  
});

describe("Array pattern tests", function() {
  it("should recognize basic types", function() {          
    var m = mm.match;
    var a = [1,2,[{x: 5}], 'string', function (x) { return x*x }];
    
    expect(m(a, {'_@a': function () {return this.a.length === 5} })).toBe(true);
    expect(m(a, { 'a': 'return true' })).toBe(true);     
    expect(m(a, { 'a(n,n|)': 'return true' })).toBe(true);
    expect(m(a, { 'a(n,n,a,s,f)': 'return true' })).toBe(true);    
    expect(thunk(m, [a, { 'a(n,n,s,a,f)': 'return true' }])).toThrow("Non-exhaustive patterns");
    expect(m(a, { 'a(_,n@x,a(o@obj)|)': 'return this.obj.x * this.x' })).toBe(10);
  });  
});
