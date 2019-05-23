/**
 * @file Helper to take an array of parameters and format them as a GET query string
 */

/**
 * Take an array of parameters and format them as a GET query string
 * @param {Array} params
 */
export default function formatGetParams(params) {
    return '?' + Object.keys(params)
        .map(function(key) {
            return key+'='+encodeURIComponent(params[key])
        }).join('&');
}