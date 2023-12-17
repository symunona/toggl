// URL of the Swiss Federal Customs Border Security API
const moment = require('moment')
const { fetchCached } = require('./cache');
const xml2js = require('xml2js');

const currencies = ['eur', 'usd', 'gbp', 'huf']

module.exports.getCurrencyExchangeRatesForDay = async function (date){

    const dateFormatted = moment(date).format('YYYYMMDD')
    console.warn('getting day exchange rates', dateFormatted)
    // Date format is yyyymmdd
    const apiUrl = `https://www.backend-rates.bazg.admin.ch/api/xmldaily?d=${dateFormatted}&locale=en`;

    const response = await fetchCached({url: apiUrl})

    // Parse the XML string
    const parser = new xml2js.Parser();

    const xml = await parser.parseStringPromise(response);

    const currencyNodes = xml.wechselkurse.devise

    // Now you can manipulate `xml` as a document
    // Example: Find a specific element

    const table = {}
    currencies.forEach((cur)=>{
        const currencyElement = currencyNodes.find((n)=>n.$.code === cur)

        let price = currencyElement?.kurs[0]

        // Sometimes it returns a larger number than 1
        // if the currency has a larger exchange rate e.g. 10 100 or 1000
        if (currencyElement.waehrung[0].length > 5) {
            const multiplier = parseInt(currencyElement.waehrung[0])
            price = price / multiplier
        }
        table[cur.toUpperCase()] = price
    })

    return table
}