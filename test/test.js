var chai = require('chai')
var expect = chai.expect;
var Deodorant = require('../deodorant');

var typecheck = new Deodorant('debug');
typecheck.addType('Position', '(Number, Number)');
typecheck.addType('Size', '{width: Number, height: Number}');

var checkSignatureForValues = typecheck.checkSignatureForValues;

describe('compound types of tuple, array, and object', function() {
    it('should allow nesting tuples and arrays', function() {
        expect(checkSignatureForValues(
            ['([Number], [String])', 'Null'],
            [[[1,3,4], ['a','b','c','d']], null]
        )).to.not.throw();
    });
    it('should allow one type in an array', function() {
        expect(checkSignatureForValues(
            ['[Number]', '[String]', '[Boolean]', 'Null'],
            [[1,2,3,4], ['a','b','c','d'], [true, false], null]
        )).to.not.throw();
    });
    it('should allow different types in a tuple', function() {
        expect(checkSignatureForValues(
            ['(Number, String, Boolean, [Number])', 'Null'],
            [[1, 'b', true, [1,2,3,4]], null]
        )).to.not.throw();
    });
    it('should allow objects with certain keys', function() {
        expect(checkSignatureForValues(
            ['{pos: Position, size: Size, username: String, onlineUsers: [String], isLoggedIn: Boolean}', 'Null'],
            [{pos: [50, 50], size: {width: 200, height: 200}, username: 'dvcolgan', onlineUsers: ['david', 'colgan'], isLoggedIn: false}, null]
        )).to.not.throw();
    });
});

describe('type aliases', function() {
    it('should work for tuples', function() {
        expect(checkSignatureForValues(
            ['Position', 'String', 'Null'],
            [[50, 100], 'something', null]
        )).to.not.throw();
    });
});

describe('type checking', function() {
    describe('should check argument lengths', function() {
        it('should throw for too few arguments', function() {
            expect(checkSignatureForValues(
                ['Number', 'Number', 'Number', 'Null'],
                [4, null]
            )).to.throw(typecheck.IncorrectArgumentCountError);
        });

        it('should throw for too many arguments', function() {
            expect(checkSignatureForValues(
                ['Number', 'Number', 'Number', 'Null'],
                [4, 3, 2, 1, null]
            )).to.throw(typecheck.IncorrectArgumentCountError);
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
        it('should check null', function() {
            expect(checkSignatureForValues(
                ['Null', 'Null', 'Null'],
                [null, null, null]
            )).to.not.throw();
        });
    });

    describe('should catch NaN', function() {
        it('should catch parameters of NaN', function() {
            expect(checkSignatureForValues(
                ['String', 'Number', 'Boolean'],
                ['a', {} / 2, true]
            )).to.throw(typecheck.IncorrectArgumentTypeError);
        });
        it('should catch return values of NaN', function() {
            expect(checkSignatureForValues(
                ['String', 'Number', 'Boolean'],
                ['a', 3, {} / 2]
            )).to.throw(typecheck.IncorrectReturnTypeError);
        });
    });
});


describe('typecheck.module', function() {
    var typedModule = typecheck.module({
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
