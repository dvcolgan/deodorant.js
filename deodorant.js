var typecheck = (function() {
    function makeCodeSmellError(name) {
        error = function (message) {
            this.name = name;
            this.message = message || 'Code smell in the code!';
            this.stack = (new Error()).stack;
        }
        error.prototype = Object.create(Error.prototype);
        error.prototype.constructor = error;
        return error;
    }

    UnknownTypeError = makeCodeSmellError('UnknownTypeError')
    IncorrectArgumentCountError = makeCodeSmellError('IncorrectArgumentCountError')
    IncorrectArgumentTypeError = makeCodeSmellError('IncorrectArgumentTypeError')
    IncorrectReturnTypeError = makeCodeSmellError('IncorrectReturnTypeError')

    //function getArrayType(arr) {
    //    var allSame = true;
    //    var typeName = 'Any';
    //    
    //    for (var i=0; i<arr.length; i++) {
    //        var value = arr[i];
    //        var type = betterTypeof(value);
    //        
    //    }
    //    return '['
    //}
    //['[Number]', '{name: String, count: Number}']

    //function objectMatchesType(obj, typeName) {
    //    if (typeName === 'Object') {
    //        if (betterTypeof(obj) == 'Object')
    //            return true;
    //    }
    //    if (typeName[0] === '{' && typeName[typeName.length-1] === '}') {

    //    }
    //    return 'Object'
    //}

    //function valueIsOfType(value, type) {
    //    if (Array.isArray(type)) {
    //        if (type.length !== 1) {
    //            throw new InvalidTypeSignatureError(type.toString() + ' is not a valid type signature.')
    //        }
    //        if (!Array.isArray(value)) {
    //            return false;
    //        }

    //    }
    //}

    function valueMatchesType(value, type) {
        if (betterTypeof(value) !== type && type !== 'Any') {
            return false;
        }
        return true;
    }

    function betterTypeof(value) {
        if (value == null) {
            return 'Null';
        }
        // NaN is the only JS type that is not equal to itself
        if (value != value) {
            return 'NaN';
        }
        // typeof [] == 'object'
        if (Array.isArray(value)) {
            return 'Array';
        }
        if (typeof value == 'number') {
            return 'Number';
        }
        if (typeof value == 'string') {
            return 'String';
        }
        if (typeof value == 'boolean') {
            return 'Boolean';
        }
        if (typeof value == 'function') {
            return 'Function';
        }
        if (typeof value == 'object') {
            return 'Object';
        }
        throw new UnknownTypeError('Unknown type for value #{value}.');
    }

    function makeTyped(signature, fn, fnName) {
        if (fnName === undefined && fn.name) {
            fnName = fn.name;
        }
        else {
            fnName = 'anonymous';
        }
        var returnType = signature[signature.length-1];
        var argTypes = signature.slice(0, signature.length - 1);
        return function() {
            var args = (
                1 <= arguments.length
                ? Array.prototype.slice.call(arguments, 0) 
                : []
            );
            var i, arg;

            // Check that we have the correct number of arguments
            if (args.length !== signature.length - 1) {
                //console.log('Arguments:', args, 'Expecting:', signature);
                throw new IncorrectArgumentCountError("Incorrect number of arguments for function \"" + fnName + "\": Expected " + (signature.length - 1) + ", but got " + args.length + ".");
            }

            // Check each argument's type
            for (i=0; i<args.length; i++) {
                arg = args[i];
                var argType = argTypes[i];

                if (!valueMatchesType(arg, argType)) {
                    throw new IncorrectArgumentTypeError(
                        "Function \"" + fnName + "\" argument " + i + " called with " + (betterTypeof(arg)) + ", expecting " + signature[i] + "."
                    );
                }
            }

            // Actually call the original function
            returnValue = fn.apply(null, args);

            // Check return value type
            if (!valueMatchesType(returnValue, returnType)) {
                //console.log('Arguments:', args, 'Expecting:', signature);
                throw new IncorrectReturnTypeError(
                    "Function \"" + fnName + "\" returned " + (betterTypeof(returnValue)) + ", expected " + returnType + "."
                );
            }

            return returnValue;
        };
    };

    function typecheckModule(spec) {
        var signatures = {};
        var fns = {};
        var other = {};
        var typedModule = {};

        // Parse out the module's type signatures and functions
        for (var key in spec) {
            var value = spec[key];
            if (key[key.length-1] === '_') {
                signatures[key] = value;
            }
            else if (typeof value === 'function') {
                // If there is also a type signature hold on to this fn,
                // otherwise just put it in the new module as is
                if (spec[(key + '_')]) {
                    fns[key] = value;
                }
                else {
                    typedModule[key] = value
                }
            }
            else {
                other[key] = value;
            }
        }

        // Wrap each function in the module
        for (var fnName in fns) {
            var fn = fns[fnName];
            var signature = signatures[fnName + '_'];
            typedModule[fnName] = makeTyped(signature, fn, fnName);
        }

        return typedModule;
    };

    return {
        typeOf: betterTypeof,
        module: typecheckModule,
        makeTyped: makeTyped,
        valueMatchesType: valueMatchesType,

        UnknownTypeError: UnknownTypeError,
        IncorrectArgumentCountError: IncorrectArgumentCountError,
        IncorrectArgumentTypeError: IncorrectArgumentTypeError,
        IncorrectReturnTypeError: IncorrectReturnTypeError
    };

})();

if (typeof module === "object" && module != null && module.exports) {
    module.exports = typecheck;
}
else if (typeof define === "function" && define.amd) {
    define(function() {
        return typecheck;
    });
}
else {
    window.typecheck = typecheck;
}
