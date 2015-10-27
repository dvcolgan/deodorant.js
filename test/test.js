var expect = require('chai').expect;
var deodorant = require('../deodorant');

var voidToStr = deodorant.makeTyped(
    ['Void', 'String'],
    function() { return ''; }
);

describe('void', function() {
    it('should work', function() {
        voidToStr(0);
    });
});

var typedModule = deodorant.module({
    add_: ['Number', 'Number', 'Number'],
    add: function(x, y) { return x + y; },

    sub_: ['Number', 'Number', 'Number'],
    sub: function(x, y) { return x - y; },

    mul_: ['Number', 'Number', 'Number'],
    mul: function(x, y) { return x * y; },

    div_: ['Number', 'Number', 'Number'],
    div: function(x, y) { return x / y; }
});

describe('typecheck.module', function() {
    it('should contain the same keys as before, minus typehint keys', function() {
        expect(typedModule).to.have.all.keys('add', 'sub', 'mul', 'div')
        expect(typedModule).to.not.have.all.keys('add_', 'sub_', 'mul_', 'div_')
    });

});

var add = deodorant.makeTyped(
    ['Number', 'Number', 'Number'],
    function add(x, y) {
        return x + y;
    }
);

// Simple one argument functions of each available type
var nullToNull = deodorant.makeTyped(
    ['Null', 'Null'],
    function(n) { return null; }
);

var arrayToArray = deodorant.makeTyped(
    ['Array', 'Array'],
    function(n) { return []; }
);

var numberToNumber = deodorant.makeTyped(
    ['Number', 'Number'],
    function(n) { return 0; }
);

var stringToString = deodorant.makeTyped(
    ['String', 'String'],
    function(n) { return ''; }
);

var booleanToBoolean = deodorant.makeTyped(
    ['Boolean', 'Boolean'],
    function(n) { return true; }
);

var functionToFunction = deodorant.makeTyped(
    ['Function', 'Function'],
    function(n) { return function() {}; }
);

var objectToObject = deodorant.makeTyped(
    ['Object', 'Object'],
    function(n) { return {}; }
);

// Simple functions that take a parameter and return it,
// but expect a certain type to be returned while ignoring the parameter's type
var fnsThatReturn = deodorant.module({
    'Null_':     ['Void', 'Null'],
    'Null':     function(n) { return n; },
    'Array_':    ['Void', 'Array'],
    'Array':    function(n) { return n; },
    'Number_':   ['Void', 'Number'],
    'Number':   function(n) { return n; },
    'String_':   ['Void', 'String'],
    'String':   function(n) { return n; },
    'Boolean_':  ['Void', 'Boolean'],
    'Boolean':  function(n) { return n; },
    'Function_': ['Void', 'Function'],
    'Function': function(n) { return n; },
    'Object_':   ['Void', 'Object'],
    'Object':   function(n) { return n; }
});

typeToFunction = {
    'Null': nullToNull,
    'Array': arrayToArray,
    'Number': numberToNumber,
    'String': stringToString,
    'Boolean': booleanToBoolean,
    'Function': functionToFunction,
    'Object': objectToObject
};

typeToDefault = {
    'Null': null,
    'Array': [],
    'Number': 0,
    'String': '',
    'Boolean': true,
    'Function': function() {},
    'Object': {}
};

var voidToVoid = deodorant.makeTyped(
    ['Void', 'Void'],
    function(x) { return x; }
);

describe('typecheck.makeTyped', function () {
    describe('should check argument lengths', function() {
        it('should throw for too few arguments', function() {
            expect(function() { add(4); }).to.throw(deodorant.IncorrectArgumentCountError);
        });
        it('should throw for too many arguments', function() {
            expect(function() { add(4, 3, 2, 1); }).to.throw(deodorant.IncorrectArgumentCountError);
        });
        it('should not throw for the correct number of arguments', function() {
            expect(function() { add(4, 3); }).to.not.throw(Error);
        });
    });

    describe('should check each argument\'s type', function() {
        // Check every possible combination of types
        for (var requiredTypeName in typeToFunction) {
            var fn = typeToFunction[requiredTypeName];
            var validValue = typeToDefault[requiredTypeName];
            for (var thisTypeName in typeToFunction) {
                if (thisTypeName === requiredTypeName) continue;
                var invalidValue = typeToDefault[thisTypeName];

                it('should throw for passing a ' + requiredTypeName + ' when expecting a ' + thisTypeName, function() {
                    expect(function() { fn(invalidValue); }).to.throw(deodorant.IncorrectArgumentTypeError);
                });
            }
            it('should not throw for passing a ' + requiredTypeName + ' when expecting a ' + thisTypeName, function() {
                expect(function() { fn(validValue); }).to.not.throw();
            });
        }
    });

    describe('void should allow any type other than NaN and undefined', function() {
        for (var typeName in typeToDefault) {
            console.log('SANTHUEASNTHESAONTHEAOSNTH',typeName);
            var value = typeToDefault[typeName];
            console.log('SANTHUEASNTHESAONTHEAOSNTH',value);
            it('should not throw for passing and returning a ' + typeName, function() {
                expect(function() { voidToVoid(value); }).to.not.throw();
            });
        }
        it('should still throw for NaN', function() {
            expect(function() { voidToVoid({} / 2); }).to.throw();
        });
    });

    describe('should check the return value\'s type', function() {
        // Check every possible combination of types
        for (var requiredTypeName in fnsThatReturn) {
            var fn = fnsThatReturn[requiredTypeName];
            var validValue = typeToDefault[requiredTypeName];
            for (var thisTypeName in fnsThatReturn) {
                if (thisTypeName === requiredTypeName) continue;
                var invalidValue = typeToDefault[thisTypeName];

                it('should throw for returning a ' + requiredTypeName + ' when expecting a ' + thisTypeName, function() {
                    expect(function() { fn(invalidValue); }).to.throw(deodorant.IncorrectReturnTypeError);
                });
            }
            it('should not throw for returning a ' + requiredTypeName + ' when expecting a ' + thisTypeName, function() {
                expect(function() { fn(validValue); }).to.not.throw();
            });
        }
    });
});
