var cache = new Cache();

export default function getCurrentStatus(request, _sender, sendResponse) {
    if (request.getNow) {
        // Sometimes the message will send twice. Cache it for a bit to keep API usage down
        if (cache.loading() === true) {cache.addCallback(sendResponse); return true;}
        else if (cache.get() !== null) {sendResponse(cache.get())}

        setTimeout(() => {cache.reset();}, 2000);

        // Action
        console.log("GETTING")
        cache.loading(true);
        callApiForCurrent(sendResponse, cache)
        return true;
    }
}

function callApiForCurrent(sendResponse, cache) {
    chrome.storage.sync.get({
        tsheets_token: '',
        tsheets_job_id: '',
        tsheets_user_id: ''
    }, (items) => {
        if (!items.tsheets_token) {
            sendResponse({
                error: {
                    message: 'One or more configuration values were empty. Please ensure extension options are set.'
                }
            })
            return;
        }

        var data = JSON.stringify({
            data: {
                on_the_clock: "both",
                user_ids: items.tsheets_user_id
            }
        });

        fetch('https://rest.tsheets.com/api/v1/reports/current_totals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + items.tsheets_token
            },
            body: data
        }).then(response => response.json()).then(response => {
            console.log(response);
            var timesheet = response.supplemental_data.timesheets[Object.keys(response.supplemental_data.timesheets)];
            var retVal = {
                status: {
                    timesheetId: response.results.current_totals[items.tsheets_user_id].timesheet_id,
                    clockedIn: response.results.current_totals[items.tsheets_user_id].on_the_clock,
                    start: timesheet.start,
                    end: timesheet.end,
                    shift_time: new Date(response.results.current_totals[items.tsheets_user_id].shift_seconds * 1000).toISOString().substr(11, 5),
                    shift_notes: timesheet.notes
                }
            }
            sendResponse(retVal)
            cache.set(retVal);
        });
    });
}

function Cache() {
    var data = null;
    var loading = false;
    var callbacks = [];

    // Add something to notify when we're set
    this.addCallback = function(c) {
        callbacks.push(c);
    }

    // Set the value and notify people interested
    this.set = function(v) {
        data = v;
        loading = false;
        
        callbacks.forEach(c => c(this.get()));
    }

    // Get the current value
    this.get = function() {
        var tmp = data;
        if (typeof tmp === "object" && tmp !== null) tmp.isCached = true;
        return tmp;
    }

    // Are we loading? Getter and setter.
    this.loading = function(val) {
        if (val) loading = val;
        return loading;
    }

    // Reset the cache
    this.reset = function() {
        data = null;
        loading = false;
        callbacks = [];
    }
}