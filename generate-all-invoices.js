const { readFileSync, readdirSync } = require('fs');
const { pdf } = require('./utils/invoice');
const { join } = require('path');

const SETTINGS = JSON.parse(readFileSync(join(__dirname, 'settings.json'), 'utf8'))

function findYearInvoices(){
    const files = readdirSync('cache/');

    // Define the regular expression pattern
    const pattern = /^invoices-(\d{4})\.json$/;

    // Filter files based on the pattern
    return files.filter(file => pattern.test(file));
}

function exportYear(file) {
    const invoices = JSON.parse(readFileSync(file, 'utf-8'))
    invoices.forEach(async (invoice)=>{
        await pdf(invoice, SETTINGS)
    })
}

const yearInvoiceFiles = findYearInvoices()
console.log()
yearInvoiceFiles.forEach((yearFile)=>exportYear('cache/'+yearFile))
