describe("Basic tests (module integrity)", function() {
  it("should exist and be available", function() {
    expect(typeof mm).toBe('function');
    expect(typeof mm.json).toBe('function');
    expect(typeof mm.compile).toBe('function');    
  });  
});
