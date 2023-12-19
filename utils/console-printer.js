const moment = require('moment')

const WIDTHS = {
    time: 5,
    unitPrice: 9,
    price: 12
}

const PAD = 2
const LINE_LENGTH = 100

module.exports.LINE_LENGTH = LINE_LENGTH

/**
 * [
 *    0: {width, text, align?'left' default}
 *    1: {width, text, align}
 * ]
 * padding:
 */
module.exports.tableLine = function(table) {
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
    }).join(' '.repeat(PAD)) + '\n'
}

module.exports.hr = function hr(text) {
    if (!text) {
        return '—'.repeat(LINE_LENGTH) + '\n'
    }
    const textLength = text.length + (PAD * 2 + 2)
    const half = (LINE_LENGTH - textLength) / 2
    let out = '—'.repeat(half) + '<' + ' '.repeat(PAD) + text + ' '.repeat(PAD) + '>' + '—'.repeat(half)
    if (half !== Math.floor(half)) {
        out += '—'
    }
    return out + '\n'
}

module.exports.printFormattedLine = function (text, duration, unitPrice, price) {

    const lineTextWidth = LINE_LENGTH - WIDTHS.time - WIDTHS.unitPrice - WIDTHS.price - (PAD * 3)

    return module.exports.tableLine([
        { text: text, width: lineTextWidth },
        { text: isNaN(parseInt(duration)) ? duration : formatDuration(duration), width: WIDTHS.time },
        { text: unitPrice, width: WIDTHS.unitPrice, align: 'right' },
        { text: price, width: WIDTHS.price, align: 'right' },
    ])
}

/**
 * @param {number} minutes
 * @returns {string} HH:MM formatted text
 */
function formatDuration(minutes) {
    let duration = moment.duration(minutes, 'minutes')
    hours = duration.hours() + (duration.days() * 24)

    return ('' + hours).padStart(2, 0) + ':' + ('' + duration.minutes()).padStart(2, 0)
}

module.exports.formatDuration = formatDuration



