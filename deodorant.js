var typecheck = (function() {
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
        throw new Error('Unknown type for value #{value}.');
    }

    return typecheck = function(spec) {
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
                fns[key] = value;
            }
            else {
                other[key] = value;
            }
        }

        for (var fnName in fns) {
            var fn = fns[fnName];
            (function(fnName, fn) {
                var signature = signatures[fnName + '_'];
                var returnType = signature[signature.length-1];
                var argTypes = signature.slice(0, signature.length - 1);

                typedModule[fnName] = function() {
                    var args = (
                        1 <= arguments.length
                        ? slice.call(arguments, 0) 
                        : []
                    );
                    var i, arg;

                    // Check that we have the correct number of arguments
                    if (args.length !== signature.length - 1) {
                        console.log('Arguments:', args, 'Expecting:', signature);
                        throw new Error("Incorrect number of arguments for function \"" + fnName + "\": Expected " + signature.length + ", but got " + args.length + ".");
                    }

                    // Check each argument's type
                    for (i=0; i<args.length; i++) {
                        arg = args[i];
                        if (betterTypeof(arg) !== signature[i]) {
                            console.log('Arguments:', args, 'Expecting:', signature);
                            throw new Error("Function \"" + fnName + "\" argument " + i + " called with " + (betterTypeof(arg)) + ", expecting " + signature[i] + ".");
                        }
                    }

                    // Make sure no arguments are NaN
                    for (i=0; i<args.length; i++) {
                        arg = args[i];
                        if (betterTypeof(arg) === 'NaN') {
                            console.log('Arguments:', args, 'Expecting:', signature);
                            throw new Error("Found a NaN argument passed to function \"" + fnName + "\", expected " + signature[i] + ".");
                        }
                    }

                    // Make sure no arguments are undefined
                    for (i=0; i<args.length; i++) {
                        arg = args[i];
                        if (typeof arg === 'undefined') {
                            console.log('Arguments:', args, 'Expecting:', signature);
                            throw new Error("Found an undefined argument passed to function \"" + fnName + "function \", expected " + signature[i] + ".");
                        }
                    }

                    // Actually call the original function
                    returnValue = fn.apply(null, args);

                    // Check return value type
                    if (betterTypeof(returnValue) !== returnType && returnType !== 'Void') {
                        console.log('Arguments:', args, 'Expecting:', signature);
                        throw new Error("Function \"" + fnName + "\" returned " + (betterTypeof(returnValue)) + ", expecting " + returnType + ".");
                    }

                    return returnValue
                };

            })(fnName, fn);
        }

        return typedModule;
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
