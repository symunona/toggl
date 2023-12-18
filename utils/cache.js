
const { default: axios } = require('axios')
const {readFileSync, existsSync, writeFileSync, mkdirSync} = require('fs')

const root = `cache/`

module.exports.get = function get(key){
    if (!existsSync(root + key + '.json')){
        console.warn('Cache does not exist for', key)
        return null
    }
    try{
        return JSON.parse(readFileSync(root + key + '.json', 'utf8'))
    } catch(e){
        console.warn('Could not read cache JSON file: ', e)
        return null
    }
}

const cache = module.exports.get('api') || {}

module.exports.set = function set(key, value){
    if (!existsSync(root)){ mkdirSync(root)}
    writeFileSync(root + key + '.json', JSON.stringify(value, null, 2))
}

/**
 * Cached API call
 * @param {Object} params
 * @returns
 */
module.exports.fetchCached = async function fetchCached({url, method, params}) {
    method = method || 'get'
    const cacheKey = getCacheKey({url, method, params})

    if (cache[cacheKey]) {
        console.log('Cached', url)
        return cache[cacheKey]
    }

    const response = await axios[method](url, params)

    cache[cacheKey] = response.data
    module.exports.set('api', cache)

    return response.data
}

function getCacheKey({url, method, params}){
    let cacheKey = method.toUpperCase() + ':' + url.substring(7)
    if (params && params.params){
        cacheKey+= JSON.stringify(params.params).replace(/"/g, '').replace(/:/g, '=')
    }
    return cacheKey
}

