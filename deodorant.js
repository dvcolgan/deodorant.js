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

    function valueToString(value) {
        if (value !== value) {
            return 'NaN';
        }
        else {
            // Wrap in try catch in case of something like a circular object
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

    function valueMatchesTupleType(value, type) {
        if (!Array.isArray(value)) {
            return false;
        }
        // For each type in the tuple, match the corresponding value
        for (var i=0; i<type.length; i++) {
            var subType = type[i];
            var subValue = value[i];
            if (!valueMatchesType(subValue, subType)) {
                return false;
            }
        }
        return true;
    }

    function valueMatchesArrayType(value, type) {
        if (!Array.isArray(value)) {
            return false;
        }
        // Iterate over each element of the value, comparing it
        // with the one type
        var subType = type[0];
        for (i=0; i<value.length; i++) {
            var subValue = value[i];
            if (!valueMatchesType(subValue, subType)) {
                return false;
            }
        }
        return true;
    }

    function valueMatchesSingleTypeObjectType(value, type) {
        var subType = type['*'];
        for (var key in value) {
            var subValue = value[key];
            if (!valueMatchesType(subValue, subType)) {
                return false;
            }
        }
        return true;
    }

    function valueMatchesMultipleTypeObjectType(value, type) {
        // Go through each key:value pair and make sure
        // the key is present and the type checks
        for (var key in type) {
            var subType = type[key];
            if (!(key in value)) {
                return false;
            }
            var subValue = value[key];
            if (!valueMatchesType(subValue, subType)) {
                return false;
            }
        }
        return true;
    }

    function valueMatchesObjectType(value, type) {
        // Check for the magic {}? nullable key and remove it
        // if the value is not null to not interfere with
        // anything else
        if (type['{}?']) {
            if (value === null) {
                return true;
            }
            else {
                type = JSON.parse(JSON.stringify(type));
                delete type['{}?'];
            }
        }
        // {'*': 'Number'} means a dict of string to Number only
        if (type['*'] && Object.keys(type).length === 1) {
            return valueMatchesSingleTypeObjectType(value, type);
        }
        // otherwise we are looking for specific keys
        else {
            return valueMatchesMultipleTypeObjectType(value, type);
        }
    }

    function valueMatchesSimpleType(value, type) {
        // Clean up any extraneous spaces
        type = type.replace(/ /g, '');
        
        // Always cry if NaN. Nobody would ever want NaN. Why is NaN in the language?
        if (value !== value) return false;

        // Only don't cry for undefined if type is Void
        if (value === undefined) {
            return (type === 'Void');
        }

        // Null is simple enough, thank goodness for triple-style equals
        if (value === null && type === 'Null') return true;

        // typeof works as it should for all of these types yay
        if (typeof value === 'number' && type === 'Number') return true;
        if (typeof value === 'string' && type === 'String') return true;
        if (typeof value === 'boolean' && type === 'Boolean') return true;
        if (typeof value == 'function' && type === 'Function') return true;

        // The Any type will cry on undefined or NaN but will accept anything else
        if (type === 'Any' || type === 'Void') return true;
        return false;
    }

    function valueMatchesType(value, type) { 
        // If the value ends with a ? it is a nullable value
        if (typeof type === 'string' && type[type.length - 1] === '?') {
            if (value === null) {
                return true;
            }
            else {
                type = type.slice(0, -1);
            }
        }

        // Replace any aliases with a deep copy
        // so we can do further modifications
        if (type in aliases) {
            type = JSON.parse(JSON.stringify(aliases[type]));
        }

        if (Array.isArray(type)) {
            if (type.length === 0) {
                // TODO make this show a better error message somehow
                return false;
            }

            // If the last element is []?, check for null,
            // if it is not null, remove that element
            if (type[type.length - 1] === '[]?') {
                if (value === null) {
                    return true;
                }
                else {
                    type = type.slice(0, -1);
                }
            }
            if (type.length === 1) {
                // Array of all the same type or empty
                // ['Number'] ['String']
                try {
                    return valueMatchesArrayType(value, type);
                }
                catch (err) {
                    return false;
                }
            }
            else {
                // Tuple (array in JS) of a fixed number of different types,
                // at least 2 (1-tuple would be the same syntax as array
                // of same type, but is also mostly useless anyway
                // ['Number', String, Boolean]'
                try {
                    var varr = valueMatchesTupleType(value, type);
                    return varr;
                }
                catch (err) {
                    return false;
                }
            }
        }

        // Object with specific keys
        // {pos: ['Number', 'Number'], size: {width: 'Number', height: 'Number'}, username: 'String', isLoggedIn: 'Boolean'}
        else if (type !== null && typeof type == 'object') {
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

        // TODO: Make a more robust checker for errors in type signatures
        //for (var j=0; j<signature.length; j++) {
        //    var type = signature[j];
        //    if ((typeof type) !== 'string') {
        //        throw new UnknownTypeError('Invalid type ' + type);
        //    }
        //}

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
                        "Function \"" + fnName + "\" argument " + i + " called with " + valueToString(arg) + ", expecting " + JSON.stringify(signature[i]) + ": " + valuesToString(args)
                    );
                }
            }

            // Actually call the original function
            returnValue = fn.apply(null, args);

            // Check return value type
            if (!valueMatchesType(returnValue, returnType)) {
                throw new IncorrectReturnTypeError(
                    "Function \"" + fnName + "\" returned " + valueToString(returnValue) + ", expected " + JSON.stringify(returnType) + ": " + valuesToString(args)
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
