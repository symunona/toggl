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

const { readFileSync, existsSync, writeFileSync } = require('fs')
const { join } = require('path')

const SETTINGS = JSON.parse(readFileSync(join(__dirname, 'settings.json'), 'utf8'))
const CACHE_FILE = './cache.json'

const cache = loadCache()

const LINE_LENGTH = 45
const FORMAT = "YYYY-MM-DD"
const API_BASE = 'https://api.track.toggl.com/reports/api/v2/summary'
const axios = require('axios')
const moment = require('moment')
const _ = require('underscore')
const PAD = '   '

const options = parseParams()

if ('h' in options){
    console.log(readFileSync('./help.md', 'utf-8'))
    process.exit()
}

// DEFAULT: Last Week

let weekOffset = 1

let from = moment().day((-7 * weekOffset) - 1).format(FORMAT)
let to = moment().day((-7 * weekOffset) + 5).format(FORMAT)
let week = moment(from).isoWeek() + 1
let multiplier = 1

console.log(`---<LOG retirever>---`)

// number: week offset
if ('w' in options) {
    weekOffset = parseInt(options.w)
    from = moment().day((-7 * weekOffset) - 1).format(FORMAT)
    to = moment().day((-7 * weekOffset) + 5).format(FORMAT)
} else if ('m' in options){
    // All activities in a month.
    const monthNumber = options.m
    if (isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) {
        throw new Error('please provide a valid month number between 1-12!')
    }
    const daysInMonth = moment().month(monthNumber-1).daysInMonth()
    from = moment().month(monthNumber-1).day(0).startOf('day').format(FORMAT)
    to = moment().month(monthNumber-1).day(daysInMonth-1).endOf('day').format(FORMAT)
    week = null
}

// Multiplier - for accounting for context switches - given in percentages
if (options.r){
    multiplier = 1 + (options.r / 100)
    console.log(`Context Switch Multiplier: ${Math.round(multiplier * 100)}%`)
}

const postParams = {
    workspace_id: SETTINGS.workspace_id,
    since: from,
    until: to,
    user_agent: 'bond'
}

getData(postParams).then((response) => {
    const projects = response

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
            const duration = entry.time * multiplier
            let timeEntry = formatDuration(duration) + PAD + entry.title.time_entry
            console.log(timeEntry)
            sum += duration
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


async function getData(postParams){
    const cacheKey = JSON.stringify(postParams).replace(/"/g, '').replace(/:/g, '=')
    if (cache[cacheKey]){
        console.log('Cached')
        return cache[cacheKey]
    }
    console.log('Not Cached')
    const response = await axios.get(API_BASE, {
        params: postParams,
        auth: {
            'username': SETTINGS.token,
            'password': 'api_token'
        }
    })
    cache[cacheKey] = response.data.data
    saveCache()
    return response.data.data
}


function saveCache(){
    writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf8')
}


function loadCache(){
    if (existsSync(CACHE_FILE)){
        try{
            return JSON.parse(readFileSync(CACHE_FILE, 'utf8'))
        }
        catch(e){
            console.warn('Cache load error: ', e)
            return {}
        }
    }
    return {}
}


function formatDuration(seconds) {
    let duration = moment.duration(seconds / 1000, 'seconds')
    hours = duration.hours() + (duration.days() * 24)

    return ('' + hours).padStart(2, 0) + ':' + ('' + duration.minutes()).padStart(2, 0)
}


function parseParams(){
    const options = {}
    for (let paramIndex in process.argv) {
        const paramKey = process.argv[paramIndex]
        // Save all the params starting with a dash as the key, and the next arg as it's value.
        if (paramKey.startsWith('-')){
            let value = process.argv[parseInt(paramIndex) + 1]
            if (!isNaN(parseInt(value))) value = parseInt(value)
            options[paramKey.substring(1)] = value
        }
    }
    return options
}