# Deodorant.js!

Optional strong typing in Javascript without precompiling!

## Rationale

Javascript is a pretty swell language and has a lot of nice things.  But one thing it is kind of sucky at is telling you why something broke.  How many times have you had to track down the source of a NaN or undefined value?  It was probably because some function was supposed to take 3 parameters and you accidentally changed something else somewhere else that now causes it to only pass 2 so the third parameter was undefined and then NaN happened and 8 functions down the call stack you finally get an error.  Ack!

In the real physical world, wearing deodorant helps us to stay cool and not smell bad.  Apply a little deodorant.js to your Javascript for maximum protection from code smells!

## Installation

    npm install deodorant

## Usage

Create a new deodorant by instantiating the Deodorant object.

```
    var deodorant = new Deodorant();
```

By default this does absolutely nothing and provides no performance penalty to your code!  Hooray!  Use this in production.  But in order to make deodorant.js check your code and not just be a worthless wrapper, enable debug mode:

```
    var deodorant = new Deodorant('debug');
```

Now you can call `deodorant.checkModule()` on any Javascript module and add Haskellesque-style type annotations to your functions as you export it:

```javascript
module.exports = deodorant.checkModule({
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
    }
});
```

Now deodorant.js will:

- Check that we have the correct number of arguments
- Check each argument's type
- Make sure no arguments are NaN
- Make sure no arguments are undefined
- Check return value type

And, it will throw an exception if any of these are ever not true.  Deodorant.js has your back.  Party!

Load as a global on `window`, with CommonJS `require`, or however AMD does things.

## Simple Types

Type signatures may include any of the follow simple types:

| Type     | Accepted values |
| -------- | --------------- |
| Number   | a number (0, 1, 1.0, -2.0) |
| String   | a string ('a', 'hello', 'what is up') |
| Boolean  | true or false |
| Function | any Javascript function |
| Null     | the single value of null |
| Any      | anything that isn't NaN or undefined |
| Void     | anything that isn't NaN, but undefined is ok |

## Compound Types

Compound types include:

* Tuples: fixed length JS array, values can be different types
* Arrays: variable length JS array, values all the same type
* Single type Objects: JS object with values all the same type
* Multiple type Objects: JS object with specified keys and values

All compound types can be nested arbitrarily deeply.

Examples of tuples:

```javascript
['Number', 'Number', 'Number']
[3, 3, 3]

['Number', 'String', 'Boolean']
[3, 'a', true]

[['Number', 'String'], ['Boolean', 'String']]
[[1, 'a'], [true, 'b']]
```

Examples of arrays:

```javascript
['Number']
[3, 3, 3]

['String']
['a', 'b', 'c']
```

Single type objects use this special syntax.  You might think of this as a Dict or Hash type:

```javascript
{'*': 'Number'}
{a: 1, b: 2, c: 3}

{'*': 'String'}
{a: 'b', b: 'c', c: 'a'}

{'*': 'Boolean'}
{a: true, b: false, c: true}
```

Multiple type objects specify the individual keys and their values.  This is like a record type:
```javascript
{col: 'Number', row: 'Number'}
{col: 1, row: 2}

{
    position: {
        col: 'Number',
        row: 'Number'
    },
    size: {
        width: 'Number',
        height: 'Number'
    }
}
{position: {col: 1, row: 2}, size: {width: 50, height: 50}}
```

## Nullable types

Any type may be made to allow that value or null by putting a `?` on the end of the type:

```javascript
['Number', 'String', 'Number?']
```

The above signature can return a Number or Null.

Because array and object literals are used for tuple, array, and object types, you can't really put a `?` on the end of them.  So special syntax had to be made, which I'm not really that happy with.  If anyone has any better ideas here I am open to changing this:

Nullable arrays and tuples:

```javascript
['Number', '[]?']
[1, 2, 3] or null

['Number, 'String', 'Boolean', '[]?']
[1, 'a', true] or null
```

Nullable objects:

```javascript
{'*': 'Number', '{}?': true}
{a: 1, b: 2, c: 3} or null

{col: 'Number', row: 'Number', '{}?': true}
{col: 1, row: 2} or null
```

## Undefined types / Optional parameters

A type can be made to allow that value or undefined by putting a `*` on the end of the type.  This effectively allows for some arguments to be optional.  Make sure not to put optional types before nonoptional types.

```javascript
['Number', 'String*', 'Number']
```

The above signature can accept a number and a string and return a number, or it can just accept a number and return a number.

Like with nullable types, array and object literals use the special key with a `*` instead of a `?`:

Optional arrays and tuples:

```javascript
['Number', '[]*']
[1, 2, 3] or undefined

['Number, 'String', 'Boolean', '[]*']
[1, 'a', true] or undefined
```

Nullable objects:

```javascript
{'*': 'Number', '{}*': true}
{a: 1, b: 2, c: 3} or undefined

{col: 'Number', row: 'Number', '{}*': true}
{col: 1, row: 2} or undefined
```

## Type Aliases

Writing out the type signature for an object with a lot of keys for a lot of functions is lame, so Deodorant.js gives you _type aliases_.  Register one with the `addAlias` method:

```
deodorant = new Deodorant('debug')
deodorant.addAlias('Vector2', {x: 'Number', y: 'Number'})
deodorant.addAlias('Coords', {col: 'Number', row: 'Number'})
deodorant.addAlias('Size', {width: 'Number', height: 'Number'})
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
deodorant.addAlias('Player', {username: 'String', position: 'Vector2', size: 'Size'});
```

This can also be used to makes sure you are passing objects created from libraries by specifying their methods:

```
    // Make a type for an HTML5 2d canvas context
    deodorant.addAlias('Context', {fillStyle: 'String', fillRect: 'Function', fillText: 'Function'});

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
    deodorant.addAlias('Promise', {then: 'Function', catch: 'Function'})

    // Socket.io socket
    deodorant.addAlias('Socket', {id: 'String', on: 'Function', emit: 'Function'})
```

## RegExp Types and Filters

For finer control of the values that can be passed to a function, you can use RegExps and Filters.  If you supply a Javascript RegExp object as a type, that value must pass a call to `test` on that RegExp.  For example:

```javascript
takesASlug_: [/-a-z0-9/, 'Boolean']
takesASlug: function(slug) {
    ...
}
```

This can be especially powerful when combined with type aliases:

```javascript
deodorant.addAlias('Slug', /-a-z0-9/);
```

For even finer control, you can use a filter, which allows you to specify an arbitrary predicate function to determine whether or not a value passes the checker.  The syntax is similar to Django template filters, using a `|` and specifying an argument with `:`.  A filter does not need to have any parameters.

```javascript
deodorant.addFilter('gte', function(value, compareTo) {
    return value >= compareTo;
});

takesGreaterThanZero_: ['Number|gte:0', 'Boolean']
takesGreaterThanZero: function(num) {
    ...
}
```

You could create filters for whether a number is within a certain range, whether a string contains certain characters, or an array contains specific values.

```javascript
deodorant.addFilter('containsAtLeast5Trues', function(value) {
    var trueCount = 0;
    for (var i=0; i<value.length; i++) {
        if (value[i] === true) {
            trueCount++;
        }
    }
    return trueCount >= 5;
}

deodorant.addFilter('containsAtLeast5TrueValues', function(value) {
    var trueCount = 0;
    for (var key in value) {
        var subValue = value[key];
        
        if (subValue === true) {
            trueCount++;
        }
    }
    return trueCount >= 5;
}
```

Naturally we have the same problem with arrays and objects as we had with nullable values, so to apply a filter to an array or object, add a `'[]|filterName`` or `'{}|filterName'` element or key into an array or object respectively:

```javascript
someFn_: [
    ['Boolean', '[]|containsAtLeast5Trues'],
    {'*': 'Number', '{}|containsAtLeast5TrueValues': true},
    'Boolean'
]
someFn: function(arr, obj) {
    ...
}
```


## Wishlist
* Optional arguments, maybe something like ['String*', 'String'] for a function that can optionally take a string parameter and returns a string. An optional parameter cannot come before a nonoptional parameter, and can't be the return type of a function.
* For functions returning Void, recheck the parameters passed in after the function is called, since Void usually means those parameters would be mutated
* Allow annotating a class to specify the types of member variables. On calling any method on that class, recheck the member variables to make sure they are the correct type.  Maybe have the class have a static value of types_: {var1: 'String', var2: 'String'}
* Better error messages for malformed type annotations
* Typecheck the arguments and return values of functions passed as parameters, maybe something like ['Number', '->', 'Number', '->', 'Number'] is a function that takes two numbers and returns a number?
* Typecheck the returned value of a promise somehow by hooking into the promise chain?
