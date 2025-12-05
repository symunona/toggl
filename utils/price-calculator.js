const { formatDuration } = require('./console-printer')
const _ = require('underscore')
const { InvoiceItem } = require('./invoice')

/**
 * Fixed projects work differently than hourly ones, I need to be able to handle that.
 *
 * @param {*} project
 * @param {*} invoice
 */
module.exports = {
    caluculateSums,
    calculateDaily,
    grossValue,
    netValue,
    round,
    inChf
}

function calculateDaily(project, invoice, client, exchangeRates) {
    let sumDays = 0;
    let sumGrossPrice = 0;
    let dailyGrossPrice = client.dailyPriceGross;

    const dailyEntries = {}

    // Group entries by day
    _.sortBy(project.items, 'time').reverse().forEach((entry) => {
        // console.log(entry)
        const date = new Date(entry.local_start)
        const dayKey = date.toISOString().split('T')[0] // YYYY-MM-DD format

        if (!dailyEntries[dayKey]) {
            dailyEntries[dayKey] = {
                date: dayKey,
                topics: [],
                durationMinutes: 60*8,
                hourlyPriceNet: client.hourlyPriceNet,
                dailySum: dailyGrossPrice
            }
            sumDays++;
        }

        if (entry.title && entry.title.time_entry) {
            dailyEntries[dayKey].topics.push(entry.title.time_entry)
        }
    })


    // Add daily rows as invoice items
    Object.keys(dailyEntries)
        .sort()
        .forEach(dayKey => {
            const day = dailyEntries[dayKey]
            invoice.items.push(new InvoiceItem({
                date: dayKey,
                description: day.topics.join(', '),
                dailyUnit: dailyGrossPrice,
                dailySum: dailyGrossPrice,
                durationMinutes: day.durationMinutes,
                durationFormatted: formatDuration(day.durationMinutes),
            }))
        })

    if (client.brief){
        // Sum up all the daily rows
        invoice.items = [new InvoiceItem({
            description: client.brief,
            dailyUnit: dailyGrossPrice,
            dailySum: dailyGrossPrice * sumDays,
            quantity: sumDays,
            durationMinutes: sumDays * 8 * 60,
            durationFormatted: formatDuration(sumDays * 8 * 60),
        })]
    }

    invoice.sumTimeMinutes = sumDays * 8 * 60;
    sumGrossPrice = sumDays * dailyGrossPrice;
    invoice.sumGross = round(sumGrossPrice, 2)

    if (invoice.currency !== 'chf'){
        invoice.exchangeRate = exchangeRates[invoice.currency]

        invoice.sumGrossChf = round(inChf(invoice.sumGross, invoice.currency, exchangeRates), 2)
    }
}

function caluculateSums(project, invoice, client, exchangeRates){
    if (client.type === 'fixed'){
        return calculateFixed(project, invoice, client, exchangeRates)
    } else if (client.type === 'daily'){
        return calculateDaily(project, invoice, client, exchangeRates)
    } else {
        return calculateHourly(project, invoice, client, exchangeRates)
    }
}

function calculateFixed(project, invoice, client, exchangeRates){
    let sumGrossPrice = client.fixedUSDGross
    let sumNetPrice = netValue(sumGrossPrice, invoice.vat)
    let sumTimeMinutes = 0

    _.sortBy(project.items, 'time').reverse().map((entry) => {

        const durationSeconds = Math.round(entry.time * invoice.multiplier / 1000)
        const durationRoundMinutes = Math.round(durationSeconds / 60)
        sumTimeMinutes += durationRoundMinutes

        invoice.items.push(new InvoiceItem({
            description: entry.title.time_entry,
            durationMinutes: durationRoundMinutes,
            durationFormatted: formatDuration(durationRoundMinutes),
        }))
    })

    invoice.sumTimeMinutes = sumTimeMinutes

    invoice.sumNet = round(sumNetPrice, 2)
    invoice.sumGross = round(sumGrossPrice, 2)

    if (invoice.currency !== 'chf'){
        invoice.exchangeRate = exchangeRates[invoice.currency]

        invoice.sumNetChf = round(inChf(sumNetPrice, invoice.currency, exchangeRates), 2)
        invoice.sumGrossChf = round(grossValue(invoice.sumNetChf, invoice.vat), 2)
    }
}

function calculateHourly(project, invoice, client, exchangeRates){
    let sumTimeMinutes = 0
    let sumNetPrice = 0

    _.sortBy(project.items, 'time').reverse().map((entry) => {

        const durationSeconds = Math.round(entry.time * invoice.multiplier / 1000)
        const durationRoundMinutes = Math.round(durationSeconds / 60)
        sumTimeMinutes += durationRoundMinutes
        const itemPrice = round(invoice.hourlyPriceNet * durationRoundMinutes / 60, 2)

        sumNetPrice += itemPrice

        invoice.items.push(new InvoiceItem({
            description: entry.title.time_entry,
            durationMinutes: durationRoundMinutes,
            durationFormatted: formatDuration(durationRoundMinutes),
            netPrice: itemPrice,
            currency: invoice.currency
        }))
    })

    invoice.sumTimeMinutes = sumTimeMinutes

    invoice.sumNet = round(sumNetPrice, 2)
    invoice.sumGross = round(grossValue(sumNetPrice, invoice.vat), 2)

    if (invoice.currency !== 'chf'){
        invoice.exchangeRate = exchangeRates[invoice.currency]

        invoice.sumNetChf = round(inChf(sumNetPrice, invoice.currency, exchangeRates), 2)
        invoice.sumGrossChf = round(grossValue(invoice.sumNetChf, invoice.vat), 2)
    }
}

/**
 * @param {number} value
 * @param {number} vat 0-100 (%)
 * @returns {number} price * (100+vat)%
 */
function grossValue(value, vat){
    return value * (1 + (vat / 100))
}

function netValue(value, vat){
    return value / (1 + (vat / 100))
}

function inChf(price, currency, currencyMap){
    return price * currencyMap[currency]
}

function round(price, zeros){
    return Math.round(price * Math.pow(10, zeros)) / Math.pow(10, zeros)
}
