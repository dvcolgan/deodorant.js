# Deodorant.js!

Optional strong typing in Javascript without precompiling!

## Installation

    npm install deodorant

## Usage

Create a new deodorant by instantiating the Deodorant object.

```
    var deodorant = new Deodorant();
```

By default this does absolutely nothing and provides no performance penalty to your code.  Use this in production.  But to make deodorant.js check your code, enable debug mode:

```
    var deodorant = new Deodorant('debug');
```

Now you can call `deodorant.module()` on any module and add Haskellesque type annotations to your functions as you export it:

```javascript
module.exports = deodorant.module({
    add_: ["Number", "Number", "Number"],
    add: function(x, y) {
        return x + y;
    },

    greetTimes_: ["String", "Number", "Array"],
    greetTimes: function(message, times) {
        var greetings = [];
        for (var i=0; i<times; i++) {
            greetings.push(message);
        }
        return greetings;
    },

    log_: ["String", "Void"],
    log: function(message) {
        console.log(message);
    },

    objLength_: ["Object", "Number"],
    objLength: function(obj) {
        var count = 0;
        for (var key in obj) {
            count++;
        }
        return count;
    }
});
```

Now deodorant.js will:
- Check that we have the correct number of arguments
- Check each argument's type
- Make sure no arguments are NaN
- Make sure no arguments are undefined
- Check return value type

Load as a global on `window`, with CommonJS `require`, and AMD.

## Type Aliases

Writing out the type signature for an object with a lot of keys for a lot of functions is lame, so Deodorant.js gives you _type aliases_.  Register one with the `addType` method:

```
deodorant = new Deodorant('debug')
deodorant.addType('Vector2', '{x: Number, y: Number}')
deodorant.addType('Coords', '{col: Number, row: Number}')
deodorant.addType('Size', '{width: Number, height: Number}')
```

And now you can use the alias in type signatures:

```
    ...
    add_: ['Vector2', 'Vector2', 'Vector2'],
    add: function(v1, v2) {
        return {
            x: v1.x + v2.x,
            y: v1.y + v2.y
        };
    }
```

You can even nest type aliases to validate deeply nested model layer-style objects:

```
deodorant.addType('Player', '{username: String, position: Vector2, size: Size}');
```

This can also be used to makes sure you are passing objects created from libraries by specifying their methods:

```
    // Make a type for an HTML5 2d canvas context
    deodorant.addType('Context', '{fillStyle: String, fillRect: Function, fillText: Function}');

```

And then:

```
    ...
    drawCircle_: ['Context', 'Vector2', 'Number'],
    drawCircle: function(ctx, position, radius) {
        ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI);
    }
    ...
```

The system will check to make sure that you pass in an object that at least has all of `fillStyle`, `fillRect`, and `fillText`.  Most library objects will have a couple of uniquely named methods that you can type check against:

```
    // A thennable from any promise library
    deodorant.addType('Promise', '{then: Function, catch: Function}')

    // Socket.io socket
    deodorant.addType('Socket', '{id: String, on: Function, emit: Function}')
```
