const { isString } = require("underscore")
const moment = require('moment')

moment.createFromInputFallback = function(config) {
    // Your custom parsing logic here
    config._d = new Date(config._i);
};

module.exports.cmdParamsParser = function () {
    const options = {}
    for (let paramIndex in process.argv) {
        const paramKey = process.argv[paramIndex]
        // Save all the params starting with a dash as the key, and the next arg as it's value.
        if (paramKey.startsWith('-')) {
            let value = process.argv[parseInt(paramIndex) + 1]

            if (isString(value)){
                // If the next argument is also a flag, just set it to true.
                if (value.startsWith('-')){ value = true }

                // Poor man's date matcher
                else if (value.indexOf('-') > -1 && moment(value).isValid()){
                    value = moment(value)
                // Handle floats for VAT
                } else if (value.indexOf(',') > -1 || value.indexOf('.') > -1 &&
                    !isNaN(parseFloat(value))){
                    value = parseFloat(value)
                }
                // If not a float, than maybe it's a normal number?
                else if (!isNaN(parseInt(value))) {
                    value = parseInt(value)
                }
                // If here, it's just a string.
            // When this is the last element, value will be undefined
            } else if (value === undefined) { value = true }

            options[paramKey.substring(1)] = value
        }
    }
    return options
}