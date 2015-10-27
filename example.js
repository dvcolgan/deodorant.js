var typecheck = require('./deodorant')


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
