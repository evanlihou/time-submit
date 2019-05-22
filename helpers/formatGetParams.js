export default function formatGetParams(params) {
    return "?" + Object.keys(params)
        .map(function(key) {
            return key+"="+encodeURIComponent(params[key])
        }).join("&");
}