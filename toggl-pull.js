/**
 * toggl console track retriever.
 *
 * Return a simple, per project list of time entries
 * for the last week.
 *
 * Not given any character, it'll return the last full week.
 * Given only one integer, it'll return the n-to last week.
 *
 * Get your month stats with -m flag e.g. `-m 10` will get
 * you all your entries in october.
 *
 * Configuration:
 * create a settings.json file as the example
 *
 * Add a multiplier that adds a specific percentage to time
 * to account for gross time spent on a task.
 *
 */

const { readFileSync } = require('fs')
const { join } = require('path')
const { fetchCached } = require('./utils/cache')
const { cmdParamsParser } = require('./utils/options-parser')

const SETTINGS = JSON.parse(readFileSync(join(__dirname, 'settings.json'), 'utf8'))

const API_BASE = 'https://api.track.toggl.com/reports/api/v2/summary'
const _ = require('underscore')
const { getInvoiceAndToggleParams } = require('./utils/get-toggle-params')
const { getCurrencyExchangeRatesForDay } = require('./utils/currency-exchange')
const { Invoice, InvoiceItem, consolePrinter, getNextInvoiceId, save, getInvoiceByPeriod, pdf } = require('./utils/invoice')
const { formatDuration } = require('./utils/console-printer')

const cmdLineParams = 'node toggl-pull.js '+ process.argv.slice(2).join(' ')

const options = cmdParamsParser()

if ('h' in options) {
    console.log(readFileSync('./help.md', 'utf-8'))
    process.exit()
}

const clientKey = options.c;

if (!clientKey){
    console.error('You need to specify a client -c param!')
}

const client = SETTINGS.clients ? SETTINGS.clients[clientKey] : undefined

if (!client){
    console.error(`Client ${clientKey} not found. Did you specify it in settings.json:clients?`)
}


console.log(`---<LOG retirever>---\n`)
console.log(cmdLineParams)
console.log('')

const {
    from,
    to,
    week,
    vat,

    date,
    due,
    year,

    multiplier
} = getInvoiceAndToggleParams(options, SETTINGS)

const hourlyPriceNet = client.hourlyPriceNet || round(netValue(client.hourlyPriceGross, vat), 2)

const invoice = new Invoice({
    from, to, week, vat, date, client, clientKey,
    due, year,
    hourlyPriceNet,
    currency: client.currency,
    company: SETTINGS.company,
    options: options,

    id: options.id || getNextInvoiceId(year)
})

const invoiceAlready = getInvoiceByPeriod(year, invoice)

if (invoiceAlready){
    console.warn('\nAn invoice covering this time and client already exists!')
    console.log('Adjusted the ID. If you want to overwrite the original invoice, call it with flags:')
    console.log(cmdLineParams + ' -save -overwrite\n')

    if (options.id && (options.id !== invoiceAlready.id)){
        console.warn('You also provided and -id for your invoice, that is not equal with the')
        console.warn('already existing one...')
        console.warn(`The already existing invoice's ID ${invoiceAlready.id} will be used!`)
    }

    invoice.id = invoiceAlready.id
}

const fetchCachedParams = {
    url: API_BASE,
    params: {
        params: {
            workspace_id: SETTINGS.workspace_id,
            since: from,
            until: to,
            user_agent: 'bond'
        },
        auth: {
            'username': SETTINGS.token,
            'password': 'api_token'
        }
    }
}

Promise.all([
    fetchCached(fetchCachedParams),
    getCurrencyExchangeRatesForDay(date)])
.then(async ([togglProjectList, exchangeRates])=>{

    const project = togglProjectList.data.find((project) => project.title.project === clientKey)

    if (!project){
        console.error(`No entries found for client ${clientKey} during this period in toggl!`)
        return;
    }

    let sumTimeMinutes = 0
    let sumNetPrice = 0


    _.sortBy(project.items, 'time').reverse().map((entry) => {

        const durationSeconds = Math.round(entry.time * multiplier / 1000)
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
    invoice.sumGross = round(grossValue(sumNetPrice, vat), 2)

    if (invoice.currency !== 'chf'){
        invoice.exchangeRate = exchangeRates[invoice.currency]

        invoice.sumNetChf = round(inChf(sumNetPrice, invoice.currency, exchangeRates), 2)
        invoice.sumGrossChf = round(grossValue(invoice.sumNetChf, invoice.vat), 2)
    }

    if ('save' in options){
        save(invoice, 'overwrite' in options)
    }

    console.log('\n\n\n')

    console.log(consolePrinter(invoice))
    if ('pdf' in options){
        pdf(invoice, SETTINGS)
    } else {

    }

    console.log('\n\n\n')
})

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
