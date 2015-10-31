deodorant = new Deodorant('debug')
deodorant.addAlias('Vector', '{x: Number, y: Number}')

class Vector
    constructor_: ['Number', 'Number', 'Void']
    constructor: (@x, @y) ->

    add_: ['Vector', 'Void']
    add: (vec) ->
        @x += vec.x
        @y += vec.y
        @

    sub_: ['Vector', 'Void']
    sub: (vec) ->
        @x -= vec.x
        @y -= vec.y
        @

    mul_: ['Vector', 'Void']
    mul: (vec) ->
        @x *= vec.x
        @y *= vec.y
        @

    div_: ['Vector', 'Void']
    div: (vec) ->
        @x /= vec.x
        @y /= vec.y
        @

    magnitude_: ['Number']
    magnitude: ->
        Math.sqrt(@x * @x + @y * @y)

    normalize_: ['Void']
    normalize: ->
        @div
            x: @magnitude()
            y: @magnitude()

    print_: ['Void']
    print: ->
        console.log(@x, @y)


Vector = deodorant.checkClass(Vector)

vec = new Vector(5, 5)
vec.add(new Vector(3, 3))
vec.print()
vec.sub(new Vector(2, 2))
vec.print()
vec.mul(new Vector(4, 4))
vec.print()
vec.div(new Vector(2, 2))
vec.print()
console.log(vec.magnitude())
vec.normalize()
vec.print()

debugger
