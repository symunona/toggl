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
 */

const { readFileSync } = require('fs')
const { join } = require('path')

const SETTINGS = JSON.parse(readFileSync(join(__dirname, 'settings.json'), 'utf8'))

const LINE_LENGTH = 45
const FORMAT = "YYYY-MM-DD"
const API_BASE = 'https://api.track.toggl.com/reports/api/v2/summary'
const axios = require('axios')
const moment = require('moment')
const _ = require('underscore')
const PAD = '   '

let weekOffset = 1


let from = moment().day((-7 * weekOffset) - 1).format(FORMAT)
let to = moment().day((-7 * weekOffset) + 5).format(FORMAT)
let week = moment(from).isoWeek() + 1

console.log(`---<LOG retirever>---`)


if (process.argv[2]) {
    if (!isNaN(parseInt(process.argv[2]))) {
        // number: week offset
        weekOffset = parseInt(process.argv[2])
    } else {
        // return all activities in a month.
        if (process.argv[2] === '-m') {
            const monthNumber = parseInt(process.argv[3])
            if (isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) {
                throw new Error('please provide a valid month number between 1-12!')
            }
            const m = parseInt(process.argv[3])
            const daysInMonth = moment().month(m-1).daysInMonth()
            from = moment().month(m-1).day(0).startOf('day').format(FORMAT)
            to = moment().month(m-1).day(daysInMonth-1).endOf('day').format(FORMAT)
            week = null
        } else {
            // Default
        }
    }
}


const postParams = {
    workspace_id: SETTINGS.workspace_id,
    since: from,
    until: to,
    user_agent: 'bond'
}

axios.get(API_BASE, {
    params: postParams,
    auth: {
        'username': SETTINGS.token,
        'password': 'api_token'
    }
}).then((response) => {
    const projects = response.data.data

    for (const i in projects) {
        const project = projects[i]

        console.log('')
        console.log(project.title.project)
        console.log('-'.repeat(project.title.project?.length))

        if (week) {
            console.log(`Week ${week}: ${from} -> ${to}`)
        } else {
            console.log(`${from} -> ${to}`)
        }


        console.log('_'.repeat(LINE_LENGTH))

        let sum = 0

        _.sortBy(project.items, 'time').reverse().map((entry) => {
            let timeEntry = formatDuration(entry.time) + PAD + entry.title.time_entry
            console.log(timeEntry)
            sum += entry.time
        })
        console.log('_'.repeat(LINE_LENGTH))
        console.log(formatDuration(sum) + PAD + `${week?'Week '+week+' ':''}SUM `)
        console.log('')
    }
}).catch((error) => {
    console.error('hmm...', error)
    debugger
})
console.log('')

function formatDuration(seconds) {
    let duration = moment.duration(seconds / 1000, 'seconds')
    hours = duration.hours() + (duration.days() * 24)

    return ('' + hours).padStart(2, 0) + ':' + ('' + duration.minutes()).padStart(2, 0)
}
