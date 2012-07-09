describe("Basic tests (module integrity)", function() {
  it("should exist and be available", function() {
    expect(typeof mm.match).toBe('function');
    expect(typeof mm.json).toBe('function');
    expect(typeof mm.compile).toBe('function');    
  });  
});

describe("Simple pattern tests", function() {
  it("should recognize basic types", function() {
        
    var numeric = mm.match(1, { 'n@n': "return this.n" });      
    var string = mm.match('s', { 's@n': "return this.n" });      
    var boolean = mm.match(true, { 'b@n': "return this.n" });          
    var fun = mm.match(function (x) {return x;}, { 'f@n': "return this.n" });
    
    expect(numeric).toBe(1);
    expect(string).toBe('s');
    expect(boolean).toBe(true);
    expect(fun(1)).toBe(1);
  });  
});
