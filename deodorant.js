var Deodorant = function(mode) {
    var check = (mode === 'debug');
    var aliases = {};

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

    UnknownTypeError = makeCodeSmellError('UnknownTypeError');
    IncorrectArgumentCountError = makeCodeSmellError('IncorrectArgumentCountError');
    IncorrectArgumentTypeError = makeCodeSmellError('IncorrectArgumentTypeError');
    IncorrectReturnTypeError = makeCodeSmellError('IncorrectReturnTypeError');

    function valueMatchesTupleType(value, type) {
        if (!Array.isArray(value)) {
            return false;
        }
        var subTypes = type.replace(/ /g, '').slice(1, -1).split(',');
        for (var i=0; i<subTypes.length; i++) {
            var subType = subTypes[i];
            var subValue = value[i];
            if (!valueMatchesType(subValue, subType)) {
                return false;
            }
        }
        return true;
    }

    function valueToString(value) {
        if (value !== value) {
            return 'NaN';
        }
        else {
            try {
                var value = JSON.stringify(value);
                return value;
            }
            catch (err) {
                return value;
            }
        }
    }

    function valuesToString(values) {
        var strs = [];
        for (var i=0; i<values.length; i++) {
            var value = values[i];
            strs.push(valueToString(value));
        }
        return strs;
    }

    function valueMatchesArrayType(value, type) {
        if (!Array.isArray(value)) {
            return false;
        }
        var subType = type.replace(/ /g, '').slice(1, -1);
        for (i=0; i<value.length; i++) {
            var subValue = value[i];
            if (!valueMatchesType(subValue, subType)) {
                return false;
            }
        }
        return true;
    }

    function valueMatchesObjectType(value, type) {
        var key, subType, subValue;

        // {Number} just means a dict of string to Number only
        if (!/[:,]/.test(type)) {
            subType = type.slice(1, -1);
            for (key in value) {
                subValue = value[key];
                if (!valueMatchesType(subValue, subType)) {
                    return false;
                }
            }
        }
        // otherwise we are looking for specific keys
        else {
            var pairs = type.replace(/ /g, '').slice(1, -1).split(',');
            // Go through each key:value pair and make sure
            // the key is present and the type checks
            for (var i=0; i<pairs.length; i++) {
                var pair = pairs[i].split(':');
                key = pair[0];
                subType = pair[1];
                if (!(key in value)) {
                    return false;
                }
                subValue = value[key];
                if (!valueMatchesType(subValue, subType)) {
                    return false;
                }
            }
        }
        return true;
    }

    function valueMatchesSimpleType(value, type) {
        if (value !== value) return false;
        if (value === undefined) {
            return (type === 'Void');
        }

        if (value === null && type === 'Null') return true;
        if (typeof value === 'number' && type === 'Number') return true;
        if (typeof value === 'string' && type === 'String') return true;
        if (typeof value === 'boolean' && type === 'Boolean') return true;
        if (typeof value == 'function' && type === 'Function') return true;

        if (type === 'Any' || type === 'Void') return true;
        return false;
    }

    function valueMatchesType(value, type) { 
        if (type in aliases) {
            type = aliases[type];
        }

        // Tuple (array in JS) of a fixed number of different types
        // '(Number, String, Boolean)'
        if (type[0] === '(') {
            try {
                return valueMatchesTupleType(value, type);
            }
            catch (err) {
                return false;
            }
        }

        // Array of all the same type or empty
        // '[Number]' '[String]'
        else if (type[0] === '[') {
            try {
                return valueMatchesArrayType(value, type);
            }
            catch (err) {
                return false;
            }
        }

        // Object with specific keys
        // {pos: (Number, Number), size: {width: Number, height: Number}, username: String, isLoggedIn: Boolean}
        else if (type[0] === '{') {
            try {
                return valueMatchesObjectType(value, type);
            }
            catch (err) {
                return false;
            }
        }

        else {
            return valueMatchesSimpleType(value, type);
        }
    }

    function checkFunction(signature, fn, fnName) {
        if (!check) {
            return fn;
        }

        for (var j=0; j<signature.length; j++) {
            var type = signature[j];
            if ((typeof type) !== 'string') {
                throw new UnknownTypeError('Invalid type ' + type);
            }
        }

        if (fnName === undefined) {
            if (fn.name) {
                fnName = fn.name;
            }
            else {
                fnName = 'anonymous';
            }
        }
        var returnType = signature[signature.length-1];
        var argTypes = signature.slice(0, signature.length - 1);

        return function() {
            var args = (1 <= arguments.length ? Array.prototype.slice.call(arguments, 0) : []);

            // Check that we have the correct number of arguments
            if (args.length !== signature.length - 1) {
                throw new IncorrectArgumentCountError(
                    "Incorrect number of arguments for function \"" + fnName + "\": Expected " + (signature.length - 1) + ", but got " + args.length + ": " + valuesToString(args)
                );
            }

            // Check each argument's type
            for (var i=0; i<args.length; i++) {
                var arg = args[i];
                var argType = argTypes[i];

                if (!valueMatchesType(arg, argType)) {
                    throw new IncorrectArgumentTypeError(
                        "Function \"" + fnName + "\" argument " + i + " called with " + valueToString(arg) + ", expecting " + signature[i] + ": " + valuesToString(args)
                    );
                }
            }

            // Actually call the original function
            returnValue = fn.apply(null, args);

            // Check return value type
            if (!valueMatchesType(returnValue, returnType)) {
                throw new IncorrectReturnTypeError(
                    "Function \"" + fnName + "\" returned " + valueToString(returnValue) + ", expected " + returnType + ": " + valuesToString(args)
                );
            }

            return returnValue;
        };
    };

    function checkModule(spec, this_) {
        var signatures = {};
        var fns = {};
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
                value = value.bind(typedModule);
                if (spec[(key + '_')]) {
                    fns[key] = value;
                }
                else {
                    typedModule[key] = value;
                }
            }
            else {
                typedModule[key] = value;
            }
        }


        // Wrap each function in the module
        for (var fnName in fns) {
            var fn = fns[fnName];
            var signature = signatures[fnName + '_'];
            typedModule[fnName] = checkFunction(signature, fn, fnName);
        }

        return typedModule;
    }

    function checkClass(class_) {
        if (!check) {
            return class_;
        }
        var factory = function(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
            return checkModule(new class_(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10));
        }
        if ('constructor_' in class_.prototype) {
            return checkFunction(class_.prototype.constructor_, factory, 'constructor');
        }
        else {
            return factory;
        }
    }

    function addAlias(name, expansion) {
        aliases[name] = expansion;
    }

    function checkSignatureForValues(signature, values) {
        return function() {
            var argValues = values.slice(0, values.length - 1);
            var returnValue = values[values.length-1];
            var fn = function () {
                return returnValue;
            };

            fn = checkFunction(signature, fn);
            fn.apply(null, argValues);
        }
    }

    return {
        UnknownTypeError: UnknownTypeError,
        IncorrectArgumentCountError: IncorrectArgumentCountError,
        IncorrectArgumentTypeError: IncorrectArgumentTypeError,
        IncorrectReturnTypeError: IncorrectReturnTypeError,

        checkFunction: checkFunction,
        checkModule: checkModule,
        checkClass: checkClass,
        addAlias: addAlias,
        valueMatchesType: valueMatchesType,
        checkSignatureForValues: checkSignatureForValues
    };

};

if (typeof module === "object" && module != null && module.exports) {
    module.exports = Deodorant;
}
else if (typeof define === "function" && define.amd) {
    define(function() {
        return Deodorant;
    });
}
else {
    window.Deodorant = Deodorant;
}
