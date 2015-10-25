betterTypeof = (value) ->
    if value == null
        return 'Null'
    # NaN is the only JS type that is not equal to itself
    if value != value
        return 'NaN'
    # typeof [] == 'object'
    if Array.isArray(value)
        return 'Array'
    if typeof value == 'number'
        return 'Number'
    if typeof value == 'string'
        return 'String'
    if typeof value == 'boolean'
        return 'Boolean'
    if typeof value == 'function'
        return 'Function'
    if typeof value == 'object'
        return 'Object'
    throw new Error("Unknown type for value #{value}.")


module.exports = typecheck = (spec) ->
    signatures = {}
    fns = {}
    other = {}
    typedModule = {}

    # Parse out the module's type signatures and functions
    for key, value of spec
        if key[key.length-1] == '_'
            signatures[key] = value
        else if typeof value == 'function'
            fns[key] = value
        else
            other[key] = value

    for fnName, fn of fns
        ((fnName, fn) ->
            signature = signatures[fnName + '_']
            returnType = signature[signature.length-1]
            argTypes = signature[...signature.length-1]

            typedModule[fnName] = (args...) ->

                # Check that we have the correct number of arguments
                if args.length != signature.length - 1
                    console.log("Arguments:", args, "Expecting:", signature)
                    throw new Error("Incorrect number of arguments for function \"#{fnName}\": Expected #{signature.length}, but got #{args.length}.")

                # Check each argument's type
                for arg, i in args
                    if betterTypeof(arg) != signature[i]
                        console.log("Arguments:", args, "Expecting:", signature)
                        throw new Error("Function \"#{fnName}\" argument #{i} called with #{betterTypeof(arg)}, expecting #{signature[i]}.")

                # Make sure no arguments are NaN
                for arg, i in args
                    if betterTypeof(arg) == 'NaN'
                        console.log("Arguments:", args, "Expecting:", signature)
                        throw new Error("Found a NaN argument passed to function \"#{fnName}\", expected #{signature[i]}.")

                # Make sure no arguments are undefined
                for arg, i in args
                    if typeof arg == 'undefined'
                        console.log("Arguments:", args, "Expecting:", signature)
                        throw new Error("Found an undefined argument passed to function \"#{fnName}function \", expected #{signature[i]}.")

                # Actually call the original function
                returnValue = fn(args...)

                # Check return value type
                if betterTypeof(returnValue) != returnType and returnType != 'Void'
                    console.log("Arguments:", args, "Expecting:", signature)
                    throw new Error("Function \"#{fnName}\" returned #{betterTypeof(returnValue)}, expecting #{returnType}.")

                return returnValue

        )(fnName, fn)

    return typedModule





mylib = typecheck
    add_: ["Number", "Number", "Number"]
    add: (x, y) ->
        return x + y

    greetTimes_: ["String", "Number", "Array"]
    greetTimes: (message, times) ->
        return (message for i in [0...times])

    log_: ["String", "Void"]
    log: (message) ->
        console.log(message)

    objLength_: ["Object", "Number"]
    objLength: (obj) ->
        (key for key, value of obj).length

`
module.exports = typecheck({
    add_: ["Number", "Number", "Number"],
    add: function(x, y) {
        return x + y;
    },

    greetTimes_: ["String", "Number", "Array"]
    greetTimes: function(message, times) {
        var greetings = [];
        for (var i=0; i<times; i++) {
            greetings.push(message);
        }
        return greetings;
    },

    log_: ["String", "Void"]
    log: function(message) {
        console.log(message);
    },

    objLength_: ["Object", "Number"]
    objLength: function(obj) {
        var count = 0;
        for (var key in obj) {
            count++;
        }
        return count;
    }
});
`



console.log mylib.add(2, 3)
console.log mylib.greetTimes('Hello', {} / 3)
console.log mylib.objLength(x:1, y:2, z:3)
