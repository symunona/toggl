// URL of the Swiss Federal Customs Border Security API
const moment = require('moment')
const { fetchCached } = require('./cache');
const xml2js = require('xml2js');
const { existsSync, readFileSync, writeFileSync, mkdirSync } = require('fs');
const path = require('path');

const currencies = ['eur', 'usd', 'gbp', 'huf']

module.exports.getCurrencyExchangeRatesForDay = async function (date) {
    const dateFormatted = moment(date).format('YYYYMMDD');
    const cacheDir = path.join('cache', 'exchange-rates');
    const cacheFile = path.join(cacheDir, `${moment(date).format('YYYY-MM-DD')}.xml`);
    let xmlString;
    // Try to read from cache first
    if (existsSync(cacheFile)) {
        try {
            xmlString = readFileSync(cacheFile, 'utf8');
        } catch (e) {
            throw new Error(`[ERROR] Could not get Exchange Rates: Failed to read cache file (${e.message})`);
        }
    } else {
        // Fetch from API and cache
        const apiUrl = `https://www.backend-rates.bazg.admin.ch/api/xmldaily?d=${dateFormatted}&locale=en`;
        try {
            const response = await fetchCached({ url: apiUrl });
            xmlString = response;
            // Save to cache
            try {
                if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });
                writeFileSync(cacheFile, xmlString, 'utf8');
            } catch (e) {
                // Cache write error is not fatal for the main flow
                console.warn('Could not write exchange rate cache:', e.message);
            }
        } catch (e) {
            throw new Error(`[ERROR] Could not get Exchange Rates: ${e.message}`);
        }
    }
    // Parse the XML string
    try {
        const parser = new xml2js.Parser();
        const xml = await parser.parseStringPromise(xmlString);
        const currencyNodes = xml.wechselkurse.devise;
        const table = {};
        currencies.forEach((cur) => {
            const currencyElement = currencyNodes.find((n) => n.$.code === cur);
            let price = parseFloat(currencyElement?.kurs[0]);
            // Sometimes it returns a larger number than 1
            // if the currency has a larger exchange rate e.g. 10 100 or 1000
            if (currencyElement && currencyElement.waehrung[0].length > 5) {
                const multiplier = parseInt(currencyElement.waehrung[0]);
                price = price / multiplier;
            }
            table[cur.toUpperCase()] = price;
        });
        return table;
    } catch (e) {
        return `Could not get Exchange Rates: Failed to parse XML (${e.message})`;
    }
}