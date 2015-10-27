var chai = require('chai')
var expect = chai.expect;
var deodorant = require('../deodorant');

function checkSignatureForValues(signature, values) {
    return function() {
        var argValues = values.slice(0, values.length - 1);
        var returnValue = values[values.length-1];
        var fn = function () {
            return returnValue;
        };

        fn = deodorant.makeTyped(signature, fn);
        fn.apply(null, argValues);
    }
}

describe('type checking', function() {
    describe('should check argument lengths', function() {
        it('should throw for too few arguments', function() {
            expect(checkSignatureForValues(
                ['Number', 'Number', 'Number', 'Null'],
                [4, null]
            )).to.throw(deodorant.IncorrectArgumentCountError);
        });

        it('should throw for too many arguments', function() {
            expect(checkSignatureForValues(
                ['Number', 'Number', 'Number', 'Null'],
                [4, 3, 2, 1, null]
            )).to.throw(deodorant.IncorrectArgumentCountError);
        });
        it('should not throw for the correct number of arguments', function() {
            expect(checkSignatureForValues(
                ['Number', 'Number', 'Number', 'Null'],
                [4, 3, 2, null]
            )).to.not.throw();
        });
    });

    describe('should check arguments and return types', function() {
        it('should check numbers', function() {
            expect(checkSignatureForValues(
                ['Number', 'Number', 'Number'],
                [1, 2.5, -1/3]
            )).to.not.throw();
        });
        it('should check strings', function() {
            expect(checkSignatureForValues(
                ['String', 'String', 'String'],
                ['Hello world', '', '3']
            )).to.not.throw();
        });
        it('should check booleans', function() {
            expect(checkSignatureForValues(
                ['Boolean', 'Boolean', 'Boolean'],
                [true, false, true]
            )).to.not.throw();
        });
        it('should check functions', function() {
            expect(checkSignatureForValues(
                ['Function', 'Function', 'Function'],
                [function() {}, function() {}, function() {}]
            )).to.not.throw();
        });
        it('should check arrays', function() {
            expect(checkSignatureForValues(
                ['Array', 'Array', 'Array'],
                [[1,2,3], [], ['a', 'b', 'c']]
            )).to.not.throw();
        });
        it('should check null', function() {
            expect(checkSignatureForValues(
                ['Null', 'Null', 'Null'],
                [null, null, null]
            )).to.not.throw();
        });
        it('should check objects', function() {
            expect(checkSignatureForValues(
                ['Object', 'Object', 'Object'],
                [{x: 1, y: 2}, {}, {a: 'z', b: 'y', c: 'x'}]
            )).to.not.throw();
        });
    });

    describe('should catch NaN', function() {
        it('should catch parameters of NaN', function() {
            expect(checkSignatureForValues(
                ['String', 'Number', 'Boolean'],
                ['a', {} / 2, true]
            )).to.throw(deodorant.IncorrectArgumentTypeError);
        });
        it('should catch return values of NaN', function() {
            expect(checkSignatureForValues(
                ['String', 'Number', 'Boolean'],
                ['a', 3, {} / 2]
            )).to.throw(deodorant.IncorrectReturnTypeError);
        });
    });
});


describe('typecheck.module', function() {
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

    it('should contain the same keys as before, minus typehint keys', function() {
        expect(typedModule).to.have.all.keys('add', 'sub', 'mul', 'div')
        expect(typedModule).to.not.have.all.keys('add_', 'sub_', 'mul_', 'div_')
    });
});
