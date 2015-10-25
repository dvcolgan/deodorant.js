# Deodorant.js!

Optional strong typing in Javascript without precompiling!

## Installation

    npm install deodorant

## Usage

Just call `typecheck()` on your module as you export it to get the following checks:

- Check that we have the correct number of arguments
- Check each argument's type
- Make sure no arguments are NaN
- Make sure no arguments are undefined
- Check return value type

Works as a global on `window`, with require, or AMD.

## Sample code

```javascript
mylib = typecheck({
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

console.log(mylib.add(2, 3));
console.log(mylib.greetTimes('Hello', 3));
console.log(mylib.objLength({x:1, y:2, z:3}));
```
