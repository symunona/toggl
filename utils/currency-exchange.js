// URL of the Swiss Federal Customs Border Security API
import moment from 'moment'
import { get, set } from './cache';

const currencies = ['eur', 'usd', 'gpb']

const cache = get('currencies')

export async function getCurrencyExchangeRatesForDay(date){

    const dateFormatted = moment(date).format('YYYYMMDD')

    if (cache && cache[dateFormatted]){
        return cache[dateFormatted]
    }

    // Date format is yyyymmdd
    const apiUrl = `https://www.backend-rates.bazg.admin.ch/api/xmldaily?d=${dateFormatted}&locale=en`;

    const response = await fetch(apiUrl)
   
    // Parse the XML string
    const parser = new DOMParser();
    const xml = parser.parseFromString(response.text(), "text/xml");    

    // Now you can manipulate `xml` as a document
    // Example: Find a specific element
    const table = currencies.map((cur)=>{
        const someElement = xml.querySelector(`[code=${cur}]`)[0];
        debugger
        console.log(someElement.textContent);
    })

    cache[dateFormatted] = table
    // set('currencies', cache)
    return table
}