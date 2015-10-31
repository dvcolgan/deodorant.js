var deodorant = new Deodorant('debug');
var Vector;

Vector = (function() {
  Vector.prototype.constructor_ = ['Number', 'Void'];

  function Vector(number) {
    this.number = number;
  }

  Vector.prototype.add_ = ['Number', 'Void'];

  Vector.prototype.add = function(x) {
    return this.number + x;
  };

  return Vector;

})();

Vector = deodorant.checkClass(Vector);

debugger;
