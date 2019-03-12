var fields = [
    "tsheets_token",
    "tsheets_job_id",
    "tsheets_user_id"
]

function save_options() {
    var save_fields = fields.reduce(function (map, value) {
        map[value] = document.getElementById(value).value;
        return map;
    }, {});
    console.log(save_fields);
    chrome.storage.sync.set(save_fields);
}

function restore_options() {
    console.log('restore');
    var restore_fields = fields.reduce(function (map, value) {
        map[value] = '';
        return map;
    }, {});
    console.log(restore_fields);
    chrome.storage.sync.get(restore_fields, function (items) {
        console.log(items);
        fields.forEach(function(key) {
            document.getElementById(key).value = items[key];
        })
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);