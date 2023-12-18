const { isDate } = require("underscore")
const { get, set } = require("./cache")
const { hr, printFormattedLine, tableLine, LINE_LENGTH } = require("./console-printer")
const moment = require('moment')

module.exports.Invoice = class Invoice {

    from
    to
    week

    hash

    date
    due

    clientKey
    client
    vat

    /**
     * @type {Array<InvoiceItem>}
     */
    items = []

    hourlyPriceGross
    hourlyPriceNet

    currency
    exchangeRate

    company

    sumTimeMinutes

    sumNet
    sumGross

    sumNetChf
    sumGrossChf

    options

    constructor(params) {
        Object.assign(this, params)
    }
}

module.exports.InvoiceItem = class InvoiceItem {
    description

    /** @type {Number} In Minutes */
    durationMinutes
    hourlyNetPrice
    netPrice
    currency

    constructor(params) {
        Object.assign(this, params)
    }
}


module.exports.getInvoices = function (year) {
    return get(getCacheStoreIdForYear(year)) || []
}

module.exports.getInvoiceByPeriod = function (year, invoiceSearch) {
    const invoices = module.exports.getInvoices(year)
    return invoices.find((invoice) => {
        // If it's a different client, it's not a match
        if (invoiceSearch.clientKey !== invoice.clientKey){ return }
        return isDateOverlap(invoice.from, invoice.to, invoiceSearch.from, invoiceSearch.to)
    })
}

function isDateOverlap(start1, end1, start2, end2) {
    // Convert the dates to moment objects
    const rangeStart1 = moment(start1);
    const rangeEnd1 = moment(end1);
    const rangeStart2 = moment(start2);
    const rangeEnd2 = moment(end2);

    // Check for overlap
    return rangeStart1.isBefore(rangeEnd2) && rangeStart2.isBefore(rangeEnd1);
}


module.exports.getNextInvoiceId = function (year) {
    const invoices = module.exports.getInvoices(year)
    let id = 1
    let i = 0
    while (i < invoices.length) {
        if (invoices[i].id >= id) {
            id = invoices[i].id + 1
        }
        i++
    }
    return id
}

module.exports.save = function (invoice, overwrite) {
    const year = invoice.year
    const invoices = module.exports.getInvoices(year)
    if (!invoice.id) { throw new Error('You must have an ID set to save an invoice!') }
    if (invoices.find((invoiceAlreadyInStore) => invoiceAlreadyInStore.id === invoice.id)) {
        if (!overwrite) {
            throw new Error('An invoice with this ID already exists. To overwrite, use the -overwrite flag!')
        }
    }
    invoices.push(invoice)
    set(getCacheStoreIdForYear(year), invoices)
}

function getCacheStoreIdForYear(year) {
    return 'invoices-' + year
}


const companyFields = ['company', 'country', 'address', 'tax']
const INVOICE_DATE_FORMAT = "YYYY-MMM-DD"


/**
 * @param {Invoice} invoice
 */
module.exports.consolePrinter = function (invoice) {
    let ret = hr('Invoice') + '\n'
    ret += 'ID: ' + invoice.year + '-' + String(invoice.id).padStart(5, 0) + '\n'
    ret += 'Date: ' + moment(invoice.date).format(INVOICE_DATE_FORMAT) + '\n'
    ret += 'Due Date: ' + moment(invoice.due).format(INVOICE_DATE_FORMAT) + '\n'

    const fromFormatted = moment(invoice.from).format(INVOICE_DATE_FORMAT)
    const toFormatted = moment(invoice.to).format(INVOICE_DATE_FORMAT)

    ret += 'Invoicing period: '

    if (invoice.week) {
        ret += `Week ${invoice.week}: between: ${fromFormatted} -> ${toFormatted}\n`
    } else {
        ret += `Between ${fromFormatted} -> ${toFormatted}\n`
    }

    if (invoice.currency !== 'chf') {
        ret += `Currency exchange rate on ${moment(invoice.date).format(INVOICE_DATE_FORMAT)}`
        ret += ` is 1 CHF = ${invoice.exchangeRate} ${invoice.currency}\n`
    }
    ret += '\n'

    ret += 'Client: \n'

    companyFields.map((key) => {
        ret += tableLine([
            { width: 2 },
            {
                width: LINE_LENGTH,
                text: invoice.client[key]
            }
        ])
    })

    ret += hr()



    ret += '\n\n'

    ret += printFormattedLine('task description', 'time', 'hourly', 'price')
    ret += printFormattedLine('', 'hh:mm', invoice.currency + ' / h', invoice.currency)

    ret += hr()

    const hourlyPriceWithCurrency = invoice.hourlyPriceNet + ' ' + invoice.currency

    invoice.items.forEach((item) => {
        ret += printFormattedLine(item.description, item.durationMinutes, hourlyPriceWithCurrency, item.netPrice + ' ' + invoice.currency)
    })

    ret += hr()

    ret += printFormattedLine('SUM NET in ' + invoice.currency, invoice.sumTimeMinutes, '', invoice.sumNet + ' ' + invoice.currency)
    ret += printFormattedLine('SUM GROSS in ' + invoice.currency + ` incl. ${invoice.vat}% VAT`, '', '', invoice.sumGross + ' ' + invoice.currency)

    ret += hr()

    if (invoice.currency !== 'CHF') {
        ret += printFormattedLine('SUM NET in CHF', '', '', invoice.sumNetChf + ' CHF')

        ret += hr()
        ret += printFormattedLine(`SUM GROSS in CHF incl. ${invoice.vat}% VAT`, '', '', invoice.sumGrossChf + ' CHF')
        ret += hr()
    }

    ret += '\n\n'

    ret += module.exports.prettyPrintObject(invoice.company) + '\n\n'

    ret += hr()
    return ret
}

module.exports.prettyPrintObject = function (object, colon = ':', join = '\n') {
    return Object.keys(object).map((key) => {
        return key + colon + ' ' + object[key]
    }).join(join)
}