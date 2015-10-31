Deodorant = require('../deodorant')
deodorant = new Deodorant()

class Vector
    constructor_: ['Number', 'Number', 'Void']
    constructor: (@x, @y) ->

    addScalar_: ['Number', 'Void']
    addScalar: (scalar) ->
        @x += scalar
        @y += scalar

    subScalar_: ['Number', 'Void']
    subScalar: (scalar) ->
        @x -= scalar
        @y -= scalar

    mulScalar_: ['Number', 'Void']
    mulScalar: (scalar) ->
        @x *= scalar
        @y *= scalar

    divScalar_: ['Number', 'Void']
    divScalar: (scalar) ->
        @x /= scalar
        @y /= scalar

Vector = deodorant.checkClass(Vector)

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

debugger;


vec = new Vector(4, 4)
vec.addScalar('1')
