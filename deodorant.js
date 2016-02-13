var Deodorant = function(mode) {
    var check = (mode === 'debug');
    var aliases = {};
    var filters = {};

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

    function stripAnnotation(type) {
        // If the value ends with a ? or * it is a nullable or optional value
        if (typeof type === 'string') {
            // Possible cases:
            // 1) a plain type, return the type and no annotations
            // 2) a type with a ? or *, return the type and the symbol
            // 3) a type with filters, return the type, an empty symbol, and an array of filters
            // 4) a type with a ? or * and filters, return the type, the symbol, and an array of filters
            // Return it like this: [type, [symbol, filters...]] for convenience
            // If there is a ? or * in the annotation, that is the start of the annotation
            var qIdx = type.indexOf('?');
            if (qIdx < 0) {
                qIdx = type.indexOf('*');
                if (qIdx < 0) {
                    qIdx = type.indexOf('|');
                }
            }
            if (qIdx >= 0) {
                return [
                    type.slice(0, qIdx),
                    type.slice(qIdx).split('|')
                ];
            }
            else {
                return [type, []];
            }
        }
        else if (Array.isArray(type)) {
            // If the last element is the filter token, use that
            lastElement = type[type.length - 1]
            if (typeof lastElement === 'string' && lastElement.indexOf('[]') === 0) {
                annotation = type[type.length - 1].slice(2);
                type = type.slice(0, -1);
                return [type, annotation.split('|')];
            }
            else {
                return [type, []];
            }
        }
        else if (type !== null && typeof type == 'object') {
            for (var typeKey in type) {
                if (typeKey.indexOf('{}') === 0) {
                    annotation = typeKey.slice(2);
                    delete type[typeKey];

                    return [type, annotation.split('|')];
                }
            }
            return [type, []];
        }
        else {
            return [type, []];
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

    function checkFilter(value, filter) {
        var pieces = filter.split(':');
        var filterName = pieces[0];
        var fn = filters[filterName];
        if (!fn(value, pieces[1])) {
            throw new Error(value + ' does not pass filter ' + filter);
        }
    }

    function checkFilters(value, theseFilters) {
        for (var i=0; i<theseFilters.length; i++) {
            checkFilter(value, theseFilters[i]);
        }
    }

    function checkRegExpType(value, type) {
        if (!type.test(value)) {
            throw new Error(value + ' does not match ' + type);
        }
    }

    function checkTupleType(value, type) {
        if (!Array.isArray(value)) {
            throw new Error(value + ' is not a JS array of type ' + type);
        }
        // For each type in the tuple, match the corresponding value
        for (var i=0; i<type.length; i++) {
            var subType = type[i];
            var subValue = value[i];
            if (!checkValuesType(subValue, subType)) {
                throw new Error(subValue + ' does not match ' + subType);
            }
        }
    }

    function checkArrayType(value, type) {
        if (!Array.isArray(value)) {
            throw new Error(value + ' is not a JS array of type ' + type);
        }
        // Iterate over each element of the value, comparing it
        // with the one type
        var subType = type[0];
        for (i=0; i<value.length; i++) {
            var subValue = value[i];
            if (!checkValuesType(subValue, subType)) {
                throw new Error(subValue + ' does not match ' + subType);
            }
        }
    }

    function checkSingleTypeObjectType(value, type) {
        var subType = type['*'];
        for (var key in value) {
            var subValue = value[key];
            try {
                checkValuesType(subValue, subType);
            }
            catch (e) {
                throw new Error(key + ' in object does not match: ' + e.message);
            }
        }
    }

    function checkMultipleTypeObjectType(value, type) {
        // Go through each key:value pair and make sure
        // the key is present and the type checks
        for (var key in type) {
            var subType = type[key];
            if (value[key] === undefined) {
                throw new Error('Object missing key ' + key);
            }
            var subValue = value[key];
            try {
                checkValuesType(subValue, subType);
            }
            catch (e) {
                throw new Error('Key ' + key + ' does not match: ' + e.message);
            }
        }
    }

    function checkObjectType(value, type) {
        // {'*': 'Number'} means a dict of string to Number only
        if (type['*'] && Object.keys(type).length === 1) {
            checkSingleTypeObjectType(value, type);
        }
        // otherwise we are looking for specific keys
        // {pos: ['Number', 'Number'], size: {width: 'Number', height: 'Number'}, username: 'String', isLoggedIn: 'Boolean'}
        else {
            checkMultipleTypeObjectType(value, type);
        }
    }

    function checkSimpleType(value, type) {
        // Clean up any extraneous spaces
        type = type.replace(/ /g, '');

        // Always cry if NaN. Nobody would ever want NaN. Why is NaN in the language?
        if (value !== value) {
            throw new Error('NaN does not match type ' + type);
        }

        // Only don't cry for undefined if type is Void
        if (value === undefined) {
            if (type !== 'Void') {
                throw new Error('Undefined does not match type ' + type);
            }
            else {
                return;
            }
        }

        // Null is simple enough, thank goodness for triple-style equals
        if (value === null && type === 'Null') return;

        // typeof works as it should for all of these types yay
        if (typeof value === 'number' && type === 'Number') return;
        if (typeof value === 'string' && type === 'String') return;
        if (typeof value === 'boolean' && type === 'Boolean') return;
        if (typeof value == 'function' && type === 'Function') return;

        // The Any type will cry on undefined or NaN but will accept anything else
        if (type === 'Any' || type === 'Void') return;

        throw new Error(value + ' does not match type ' + type);
    }

    function checkValuesType(value, type) {
        var res = stripAnnotation(type);
        type = res[0];
        var annotation = res[1];
        var isNullable = annotation[0] === '?';
        var isUndefinedable = annotation[0] === '*';
        var theseFilters = annotation.slice(1, annotation.length);

        // Do nullable check
        if (isNullable && value === null) {
            return;
        }
        if (isUndefinedable && value === undefined) {
            return;
        }

        if (theseFilters.length > 0) {
            checkFilters(value, theseFilters);
        }

        //PositiveInteger -> Integer|gte:0 -> Number|isInteger|gte:0

        // Replace any aliases with a deep copy
        // so we can do further modifications, and recurse
        if (typeof type === 'string' && type in aliases) {
            type = JSON.parse(JSON.stringify(aliases[type]));
            checkValuesType(value, type);
            return;
        }


        // Check regexps
        if (Object.prototype.toString.call(type) === '[object RegExp]') {
            checkRegExpType(value, type);
            return;
        }

        // Check arrays and tuples
        else if (Array.isArray(type)) {
            if (type.length === 0) {
                // TODO make this show a better error message somehow
                return false;
            }
            if (type.length === 1) {
                // Array of all the same type or empty
                // ['Number'] ['String']
                try {
                    checkArrayType(value, type);
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
                    var varr = checkTupleType(value, type);
                    return varr;
                }
                catch (err) {
                    return false;
                }
            }
        }

        // Check objects
        else if (type !== null && typeof type == 'object') {
            checkObjectType(value, type);
        }

        // Check simple values
        else {
            checkSimpleType(value, type);
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
        //        throw new Error('Invalid type ' + type);
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
            // Optional parameters make this check harder, do we actually need it though?
            //if (args.length !== signature.length - 1) {
            //    throw new Error('Incorrect number of arguments for function "' + fnName + '": Expected ' + (signature.length - 1) + ', but got ' + args.length);
            //}

            // Check each argument's type
            for (var i=0; i<argTypes.length; i++) {
                var argType = argTypes[i];
                var arg = args[i];

                try {
                    checkValuesType(arg, argType);
                }
                catch (e) {
                    throw new Error('Function "' + fnName + '" argument ' + i + ' does not match: ' + e.message);
                }
            }

            // Actually call the original function
            returnValue = fn.apply(null, args);

            // Check return value type
            try {
                checkValuesType(returnValue, returnType);
            }
            catch (e) {
                throw new Error('Function "' + fnName + '" return value does not match: ' + e.message);
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
    function addFilter(name, fn) {
        filters[name] = fn;
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
        checkFunction: checkFunction,
        checkModule: checkModule,
        checkClass: checkClass,
        addAlias: addAlias,
        addFilter: addFilter,
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
