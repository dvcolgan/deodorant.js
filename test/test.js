var chai = require('chai')
var expect = chai.expect;
var Deodorant = require('../deodorant');

var typecheck = new Deodorant('debug');
typecheck.addAlias('Position', ['Number', 'Number']);
typecheck.addAlias('Size', {width: 'Number', height: 'Number'});

checkSignatureForValues = typecheck.checkSignatureForValues;

typecheck.addFilter('gte', function(value, comparedTo) {
    return value >= comparedTo;
});
typecheck.addFilter('lte', function(value, comparedTo) {
    return value <= comparedTo;
});
typecheck.addFilter('gt', function(value, comparedTo) {
    return value > comparedTo;
});
typecheck.addFilter('lt', function(value, comparedTo) {
    return value < comparedTo;
});
typecheck.addFilter('isInteger', function(value) {
    return value % 1 === 0;
});

typecheck.addAlias('Integer', 'Number|isInteger');
typecheck.addAlias('PositiveInteger', 'Integer|gte:0');

typecheck.addAlias('Slug', /[-a-z0-9]+/);

describe('filters', function() {
    it('should allow specifying new filters', function() {
        expect(checkSignatureForValues(
            [
                'Number|gte:0|lte:100',
                'Number|gte:0|lte:100',
                'Number|gt:0|lt:100',
                'Number|gt:0|lt:100'
            ],
            [0, 100, 1, 99]
        )).to.not.throw();
        expect(checkSignatureForValues(
            [
                'Number|gte:0|lte:100',
                'Number|gte:0|lte:100',
                'Number|gt:0|lt:100',
                'Number|gt:0|lt:100'
            ],
            [-1, 101, 0, 100]
        )).to.throw();
    });
    it('should allow filters on aliases', function() {
        expect(checkSignatureForValues(
            ['Integer', 'Integer', 'Integer'],
            [1, 2, 3]
        )).to.not.throw();
        expect(checkSignatureForValues(
            ['Integer', 'Integer', 'Integer'],
            [1.1, 2.1, 3.1]
        )).to.throw();
    });
    it('should allow chaining filters', function() {
        expect(checkSignatureForValues(
            ['Number|isInteger|gte:0', 'Number|isInteger|gte:0', 'Number|isInteger|gte:0'],
            [1, 2, 3]
        )).to.not.throw();
    });
    it('should allow nested alias and filters', function() {
        expect(checkSignatureForValues(
            ['PositiveInteger', 'PositiveInteger', 'PositiveInteger'],
            [1, 2, 3]
        )).to.not.throw();
        expect(checkSignatureForValues(
            ['PositiveInteger', 'PositiveInteger', 'PositiveInteger'],
            [-1, -2, -3]
        )).to.throw();
        expect(checkSignatureForValues(
            ['PositiveInteger', 'PositiveInteger', 'PositiveInteger'],
            [1.1, 2.1, 3.1]
        )).to.throw();
    });
});


describe('compound types of tuple, array, and object', function() {
    it('should allow nesting tuples and arrays', function() {
        expect(checkSignatureForValues(
            [[['Number'], ['String']], 'Null'],
            [[[1,3,4], ['a','b','c','d']], null]
        )).to.not.throw();
    });
    it('should allow one type in an array', function() {
        expect(checkSignatureForValues(
            [['Number'], ['String'], ['Boolean'], 'Null'],
            [[1,2,3,4], ['a','b','c','d'], [true, false], null]
        )).to.not.throw();
    });
    it('should allow different types in a tuple', function() {
        expect(checkSignatureForValues(
            [['Number', 'String', 'Boolean', ['Number']], 'Null'],
            [[1, 'b', true, [1,2,3,4]], null]
        )).to.not.throw();
    });
    it('should allow objects with certain keys', function() {
        expect(checkSignatureForValues(
            [{pos: 'Position', size: 'Size', username: 'String', onlineUsers: ['String'], isLoggedIn: 'Boolean'}, 'Null'],
            [{pos: [50, 50], size: {width: 200, height: 200}, username: 'dvcolgan', onlineUsers: ['david', 'colgan'], isLoggedIn: false}, null]
        )).to.not.throw();
    });
    it('should allow objects with all the same type of values', function() {
        expect(checkSignatureForValues(
            [{'*': 'Position'}, 'Void'],
            [{
                p1: [50, 50], 
                p2: [50, 50], 
                p3: [50, 50], 
                p4: [50, 50], 
                p5: [50, 50], 
                p6: [50, 50], 
            }, undefined]
        )).to.not.throw();
    });
    it('should make sure all keys are present', function() {
        expect(checkSignatureForValues(
            [{x: 'Number', y: 'Number'}, 'Void'],
            [{x: 1}, null]
        )).to.throw();
    });
});


describe('type aliases', function() {
    it('should work for tuples', function() {
        expect(checkSignatureForValues(
            [['Position', 'String'], 'Null'],
            [[[50, 100], 'something'], null]
        )).to.not.throw();
    });
});


describe('nullable types', function() {
    it('should accept null if a ? is on the end', function() {
        expect(checkSignatureForValues(
            ['Number?', 'Number?', 'Number?'],
            [null, null, null]
        )).to.not.throw();
    });
    it('should accept the type even if a ? is on the end', function() {
        expect(checkSignatureForValues(
            ['Number?', 'Number?', 'Number?'],
            [1, 2, 3]
        )).to.not.throw();
    });
    it('should not accept a wrong type even if a ? is on the end', function() {
        expect(checkSignatureForValues(
            ['Number?', 'Number?', 'Number?'],
            ['a', 'b', 'c']
        )).to.throw();
    });
    it('should allow nullable tuples containing []?', function() {
        expect(checkSignatureForValues(
            [['Number', 'String', 'Boolean', '[]?'], 'Null'],
            [[1, 'a', true], null]
        )).to.not.throw();
        expect(checkSignatureForValues(
            [['Number', 'String', 'Boolean', '[]?'], 'Null'],
            [null, null]
        )).to.not.throw();
    });
    it('should allow nullable arrays containing []?', function() {
        expect(checkSignatureForValues(
            [['Number', '[]?'], ['String', '[]?'], ['Boolean', '[]?']],
            [[1, 2, 3], ['a', 'b', 'c'], [true, false, true]]
        )).to.not.throw();
        expect(checkSignatureForValues(
            [['Number', '[]?'], ['String', '[]?'], ['Boolean', '[]?']],
            [null, null, null]
        )).to.not.throw();
    });
    it('should allow nullable objects containing {}?', function() {
        expect(checkSignatureForValues(
            [{'*': 'Number', '{}?': true}, 'Null'],
            [{a: 1, b: 2, c: 3}, null]
        )).to.not.throw();
        expect(checkSignatureForValues(
            [{'*': 'Number', '{}?': true}, 'Null'],
            [null, null]
        )).to.not.throw();

        expect(checkSignatureForValues(
            [{col: 'Number', row: 'Number', '{}?': true}, 'Null'],
            [{col: 1, row: 2}, null]
        )).to.not.throw();
        expect(checkSignatureForValues(
            [{col: 'Number', row: 'Number', '{}?': true}, 'Null'],
            [null, null]
        )).to.not.throw();
    });
    it('should work for aliases', function() {
        expect(checkSignatureForValues(
            ['Position?', 'Position?', 'Position?'],
            [[50, 100], [44, 33], [11, 22]]
        )).to.not.throw();
        expect(checkSignatureForValues(
            ['Position?', 'Position?', 'Position?'],
            [null, null, null]
        )).to.not.throw();
    });
});

describe('optional parameters', function() {
    it('should accept undefined if a * is on the end', function() {
        expect(checkSignatureForValues(
            ['Number*', 'Number*', 'Number'],
            [1, 1, 1]
        )).to.not.throw();
        expect(checkSignatureForValues(
            ['Number*', 'Number*', 'Number'],
            [1, 1]
        )).to.not.throw();
        expect(checkSignatureForValues(
            ['Number*', 'Number*', 'Number'],
            [1]
        )).to.not.throw();
    });
    it('should allow optional tuples containing []*', function() {
        it('supplying a valid value', function() {
            expect(checkSignatureForValues(
                [['Number', 'String', 'Boolean', '[]*'], 'Null'],
                [[1, 'a', true], null]
            )).to.not.throw();
        });
        it('not supplying a value', function() {
            expect(checkSignatureForValues(
                [['Number', 'String', 'Boolean', '[]*'], 'Null'],
                [null]
            )).to.not.throw();
        });
        it('supplying an invalid value', function() {
            expect(checkSignatureForValues(
                [['Number', 'String', 'Boolean', '[]*'], 'Null'],
                [[1,2,2], null]
            )).to.throw();
        });
    });
    it('should allow undefined arrays containing []*', function() {
        expect(checkSignatureForValues(
            [['Number', '[]*'], ['String', '[]*'], 'Null'],
            [[1, 2, 3], ['a', 'b', 'c'], null]
        )).to.not.throw();
        expect(checkSignatureForValues(
            [['Number', '[]*'], ['String', '[]*'], 'Null'],
            [null]
        )).to.not.throw();
    });
    it('should allow nullable objects containing {}*', function() {
        expect(checkSignatureForValues(
            [{'*': 'Number', '{}*': true}, 'Null'],
            [{a: 1, b: 2, c: 3}, null]
        )).to.not.throw();
        expect(checkSignatureForValues(
            [{'*': 'Number', '{}*': true}, 'Null'],
            [null]
        )).to.not.throw();

        expect(checkSignatureForValues(
            [{col: 'Number', row: 'Number', '{}*': true}, 'Null'],
            [{col: 1, row: 2}, null]
        )).to.not.throw();
        expect(checkSignatureForValues(
            [{col: 'Number', row: 'Number', '{}*': true}, 'Null'],
            [null]
        )).to.not.throw();
    });
    it('should work for aliases', function() {
        expect(checkSignatureForValues(
            ['Position*', 'Position*', 'Null'],
            [[50, 100], [44, 33], null]
        )).to.not.throw();
        expect(checkSignatureForValues(
            ['Position*', 'Position*', 'Null'],
            [null]
        )).to.not.throw();
    });
});

describe('type checking', function() {
    describe('should check argument lengths', function() {
        it('should throw for too few arguments', function() {
            expect(checkSignatureForValues(
                ['Number', 'Number', 'Number', 'Null'],
                [4, null]
            )).to.throw();
        });

        //it('should throw for too many arguments', function() {
        //    expect(checkSignatureForValues(
        //        ['Number', 'Number', 'Number', 'Null'],
        //        [4, 3, 2, 1, null]
        //    )).to.throw();
        //});
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
        it('should check regexps that pass', function() {
            expect(checkSignatureForValues(
                [/a/, /b/, /c/],
                ['a', 'b', 'c']
            )).to.not.throw();
        });
        it('should check regexps that don\'t pass', function() {
            expect(checkSignatureForValues(
                [/a/, /b/, /c/],
                ['b', 'c', 'a']
            )).to.throw();
        });
        it('should check tuples', function() {
            expect(checkSignatureForValues(
                [
                    ['Number', 'String', 'Boolean'],
                    ['Number', 'String', 'Boolean'],
                    ['Number', 'String', 'Boolean'],
                    ['Number', 'String', 'Boolean']
                ],
                [
                    [1, 'a', true],
                    [2, 'b', false],
                    [3, 'c', true],
                    [4, 'd', false]
                ]
            )).to.not.throw();
        });
        it('should check arrays', function() {
            expect(checkSignatureForValues(
                [
                    ['Number'],
                    ['String'],
                    ['Boolean'],
                    ['Null']
                ],
                [
                    [1, 2, 3],
                    ['a', 'b', 'c'],
                    [true, false, true],
                    [null, null, null]
                ]
            )).to.not.throw();
        });
        it('should check objects of the same type', function() {
            expect(checkSignatureForValues(
                [
                    {'*': 'Number'},
                    {'*': 'String'},
                    {'*': 'Boolean'},
                ],
                [
                    {'a': 1, 'b': 2, 'c': 3},
                    {'a': 'c', 'b': 'b', 'c': 'a'},
                    {'a': true, 'b': false, 'c': true}
                ]
            )).to.not.throw();
        });
        it('should check objects of different types and keys', function() {
            expect(checkSignatureForValues(
                [
                    {num: 'Number', str: 'String', bool: 'Boolean'},
                    {num: 'Number', str: 'String', bool: 'Boolean'},
                    {num: 'Number', str: 'String', bool: 'Boolean'},
                    {num: 'Number', str: 'String', bool: 'Boolean'}
                ],
                [
                    {num: 1, str: 'a', bool: true},
                    {num: 2, str: 'b', bool: false},
                    {num: 3, str: 'c', bool: true},
                    {num: 4, str: 'd', bool: false}
                ]
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


describe('checkModule', function() {
    var typedModule = typecheck.checkModule({
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
