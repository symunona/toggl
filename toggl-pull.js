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

const LINE_LENGTH = 100

const API_BASE = 'https://api.track.toggl.com/reports/api/v2/summary'
const moment = require('moment')
const _ = require('underscore')
const { getToggleParams, API_DATE_FORMAT } = require('./utils/get-toggle-params')
const { getCurrencyExchangeRatesForDay } = require('./utils/currency-exchange')

const companyFields = ['company', 'country', 'address', 'tax']

const PAD = 2

const options = cmdParamsParser()

if ('h' in options) {
    console.log(readFileSync('./help.md', 'utf-8'))
    process.exit()
}

console.log(`---<LOG retirever>---`)

const {from, to, week, multiplier} = getToggleParams(options)

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


fetchCached(fetchCachedParams).then(async (response) => {

    const exchangeRates = await getCurrencyExchangeRatesForDay(new Date())
    console.warn(exchangeRates)

    const projects = response.data

    for (const i in projects) {
        const project = projects[i]

        if (options.s && options.s !== project.title.project) continue

        const client = SETTINGS.clients ? SETTINGS.clients[project.title.project] : undefined

        console.log('')
        // console.log(project.title.project)

        hr('Invoice')

        if (client) {
            console.log('Client: ')

            companyFields.map((key) => {
                console.log(tableLine([
                    {width: 2},
                    {
                        width: LINE_LENGTH,
                        text: client[key]
                    }
                ]))})
        }

        console.log('')
        console.log('Invoice Date:', moment().format(API_DATE_FORMAT))


        hr()

        if (week) {
            console.log(`Week ${week}: Worked between: ${from} -> ${to}`)
        } else {
            console.log(`Work between ${from} -> ${to}`)
        }

        console.log('')
        console.log('')

        let sumTime = 0
        let sumPrice = 0

        const hourlyPrice = client?.rate ? parseInt(client.rate) : ''
        const hourlyPriceWithCurrency = hourlyPrice ? hourlyPrice + ' ' + client.currency : ''

        printFormattedLine('description', 'time', 'hourly', 'price')
        printFormattedLine('', 'hh:mm', client.currency + ' / h', client.currency)
        hr()

        _.sortBy(project.items, 'time').reverse().map((entry) => {
            const durationSeconds = Math.round(entry.time * multiplier / 1000)
            const durationRoundMinutes = Math.round(durationSeconds / 60)
            sumTime += durationRoundMinutes
            let price
            if (hourlyPrice) {
                price = Math.round(hourlyPrice * durationRoundMinutes / 60)
                sumPrice += price
                if (client.currency) {
                    price += ' ' + client.currency
                }
            }
            printFormattedLine(entry.title.time_entry, durationSeconds, hourlyPriceWithCurrency, price)
        })

        hr()
        printFormattedLine('SUM NET in ' + client.currency, sumTime * 60, '', sumPrice + ' ' + client.currency)

        // If the currency is not in CHF, we need the CHF amount in the end.
        if (client.currency !== 'CHF'){
            const chfValue = Math.round(sumPrice * exchangeRates[client.currency])
            printFormattedLine('SUM Net in CHF', '', '',  chfValue + ' CHF')

            
        }


        console.log('')
    }
})
// .catch((error) => {
//     console.error('hmm...', error)
//     debugger
// })

console.log('')

// --------------------------------------------------------------------------------------------------


// text     time (5) unit_price (3) price (4)
/**
 * [
 *    0: {width, text, align?'left' default}
 *    1: {width, text, align}
 * ]
 * padding:
 */
function tableLine(table) {
    return table.map((field) => {
        let text = field.text === undefined ? '' : String(field.text)
        if (text.length > field.width) {
            // Good enough for now
            text = text.substring(0, field.width - 3) + '...'
        } else if (text.length < field.width) {
            if (field.align === 'right') {
                text = ' '.repeat(field.width - text.length) + text
            } else {
                // Default LEFT align
                text = text + ' '.repeat(field.width - text.length)
            }
        }

        return text
    }).join(' '.repeat(PAD))
}


const WIDTHS = {
    time: 5,
    unitPrice: 7,
    price: 8
}

function printFormattedLine(text, duration, unitPrice, price) {

    const lineTextWidth = LINE_LENGTH - WIDTHS.time - WIDTHS.unitPrice - WIDTHS.price - (PAD * 3)

    console.log(tableLine([
        { text: text, width: lineTextWidth },
        { text: isNaN(parseInt(duration)) ? duration : formatDuration(duration), width: WIDTHS.time },
        { text: unitPrice, width: WIDTHS.unitPrice, align: 'right' },
        { text: price, width: WIDTHS.price, align: 'right' },
    ]))
}

function hr(text) {
    if (!text){
        console.log('—'.repeat(LINE_LENGTH))
        return
    }
    const textLength = text.length + (PAD * 2 + 2)
    const half = (LINE_LENGTH - textLength) / 2
    let out = '—'.repeat(half) + '<' + ' '.repeat(PAD) + text + ' '.repeat(PAD) + '>' + '—'.repeat(half)
    if (half !== Math.floor(half)){
        out+= '—'
    }
    console.log(out)
}




function formatDuration(seconds) {
    let duration = moment.duration(seconds, 'seconds')
    hours = duration.hours() + (duration.days() * 24)

    return ('' + hours).padStart(2, 0) + ':' + ('' + duration.minutes()).padStart(2, 0)
}


