const moment = require('moment')

const API_DATE_FORMAT = "YYYY-MM-DD"

module.exports.API_DATE_FORMAT = API_DATE_FORMAT

module.exports.getToggleParams = function (options) {

    // number: week offset
    let weekOffset = 1
    let multiplier = 1

    // DEFAULT: Last Week
    let from = moment().day((-7 * weekOffset) - 1).format(API_DATE_FORMAT)
    let to = moment().day((-7 * weekOffset) + 5).format(API_DATE_FORMAT)
    let week = moment(from).isoWeek() + 1

    if ('w' in options) {
        weekOffset = parseInt(options.w)
        from = moment().day((-7 * weekOffset) - 1).format(API_DATE_FORMAT)
        to = moment().day((-7 * weekOffset) + 5).format(API_DATE_FORMAT)
    } else if ('m' in options) {
        // All activities in a month.
        const monthNumber = options.m
        if (isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) {
            throw new Error('please provide a valid month number between 1-12!')
        }
        const daysInMonth = moment().month(monthNumber - 1).daysInMonth()
        from = moment().month(monthNumber - 1).day(0).startOf('day').format(API_DATE_FORMAT)
        to = moment().month(monthNumber - 1).day(daysInMonth - 1).endOf('day').format(API_DATE_FORMAT)
        week = null
    }

    // Multiplier - for accounting for context switches - given in percentages
    if (options.r) {
        multiplier = 1 + (options.r / 100)
        console.log(`Context Switch Multiplier: ${Math.round(multiplier * 100)}%`)
    }
    return {from, to, week, multiplier}
}
