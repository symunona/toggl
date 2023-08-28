/**
 * toggl console track retriever.
 *
 * Return a simple, per project list of time entries
 * for the last week.
 *
 * Configuration:
 * create a settings.json file as the example
 *
 */

const readFileSync = require('fs').readFileSync

const SETTINGS = JSON.parse(readFileSync('./settings.json', 'utf8'))

const LINE_LENGTH = 45
const FORMAT = "YYYY-MM-DD"
const API_BASE = 'https://api.track.toggl.com/reports/api/v2/summary'
const axios = require('axios')
const moment = require('moment')
const _ = require('underscore')
const PAD = '   '

let weekOffset = 1

if (process.argv[2]){
    if (isNaN(parseInt(process.argv[2]))){
        throw new Error('First parameter should be an Integer.')
    }
    // number: week offset
    weekOffset = parseInt(process.argv[2])
}

const since = moment().day((-7 * weekOffset) - 1).format(FORMAT)
const until = moment().day((-7 * weekOffset) + 5).format(FORMAT)
const week = moment(since).isoWeek() + 1

console.log(`---<LOG retirever>---\n\n`)
console.log(`Week ${week}: ${since} -> ${until}`)

const postParams = {
    workspace_id: SETTINGS.workspace_id,
    since,
    until,
    user_agent: 'bond'
}

axios.get(API_BASE, {
    params:postParams,
    auth: {
        'username': SETTINGS.token,
        'password': 'api_token'
    }
}).then((response) => {
    const projects = response.data.data

    for (const i in projects){
        const project = projects[i]

        console.log('')
        console.log(project.title.project)
        console.log('-'.repeat(project.title.project?.length))
        console.log(`Week ${week}: ${since} -> ${until}`)
        console.log('_'.repeat(LINE_LENGTH))

        let sum = 0

        _.sortBy(project.items, 'time').reverse().map((entry)=>{
            let timeEntry = formatDuration(entry.time) + PAD + entry.title.time_entry
            console.log(timeEntry)
            sum += entry.time
        })
        console.log('_'.repeat(LINE_LENGTH))
        console.log(formatDuration(sum) + PAD + `Week ${week} SUM `)
        console.log('')
    }
}).catch((error) => {
    console.error('hmm...', error)
    debugger
})
console.log('')

function formatDuration(seconds){
    let duration = moment.duration(seconds / 1000,'seconds')
    hours = duration.hours() + (duration.days() * 24)

    return (''+hours).padStart(2,0) + ':' + (''+duration.minutes()).padStart(2,0)
}
