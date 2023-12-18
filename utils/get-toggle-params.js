const moment = require('moment')

const API_DATE_FORMAT = "YYYY-MM-DD"

module.exports.API_DATE_FORMAT = API_DATE_FORMAT

module.exports.getInvoiceAndToggleParams = function (options, settings) {

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
        week = moment(from).isoWeek() + 1
    } else if ('m' in options) {
        // All activities in a month.
        const monthNumber = options.m
        if (isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) {
            throw new Error('please provide a valid month number between 1-12!')
        }
        from = moment().month(monthNumber - 1).startOf('month').startOf('day').format(API_DATE_FORMAT)
        to = moment().month(monthNumber - 1).endOf('month').endOf('day').format(API_DATE_FORMAT)
        week = null
    }

    // Multiplier - for accounting for context switches - given in percentages
    if (options.r) {
        multiplier = 1 + (options.r / 100)
        console.log(`Context Switch Multiplier: ${Math.round(multiplier * 100)}%`)
    }
    const vat = options.vat || settings.defaultVat
    const date = options.date ? moment(options.date) : new Date()
    const due = moment(date).add(1, 'month')
    const year = moment(date).year()

    return {
        from,
        to,
        week,

        multiplier,
        vat,

        date,
        year,
        due
    }
}
