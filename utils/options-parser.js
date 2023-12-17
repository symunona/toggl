
module.exports.cmdParamsParser = function(){
    const options = {}
    for (let paramIndex in process.argv) {
        const paramKey = process.argv[paramIndex]
        // Save all the params starting with a dash as the key, and the next arg as it's value.
        if (paramKey.startsWith('-')) {
            let value = process.argv[parseInt(paramIndex) + 1]
            if (!isNaN(parseInt(value))) value = parseInt(value)
            options[paramKey.substring(1)] = value
        }
    }
    return options
}