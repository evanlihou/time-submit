import Cache from '../helpers/cache.js';
import setIconStatus from './set_icon_status.js';

var cache = new Cache();

export default function getCurrentStatus(request, _sender, sendResponse) {
    console.log('Message: Getting current status')
    // Sometimes the message will send twice. Cache it for a bit to keep API usage down
    if (cache.loading === true) { cache.addCallback(sendResponse); return true; }
    else if (cache.data !== null) { sendResponse(cache.data) }

    // Action
    cache.loading = true;
    callApiForCurrent(request, sendResponse, cache)
    return true;
}

function callApiForCurrent(request, sendResponse, cache) {
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
                on_the_clock: 'both',
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
            if (response.supplemental_data.timesheets)
                var timesheet = response.supplemental_data.timesheets[response.results.current_totals[items.tsheets_user_id].timesheet_id];
            var retVal = {
                status: {
                    timesheetId: response.results.current_totals[items.tsheets_user_id].timesheet_id,
                    clockedIn: response.results.current_totals[items.tsheets_user_id].on_the_clock,
                    start: timesheet ? timesheet.start : null,
                    end: timesheet ? timesheet.end : null,
                    shift_time: new Date(response.results.current_totals[items.tsheets_user_id].shift_seconds * 1000).toISOString().substr(11, 5),
                    shift_notes: timesheet ? timesheet.notes : null
                }
            }
            sendResponse(retVal)
            if (request !== null && request.getNow.updateIcon === true) {
                setIconStatus(retVal);
            }
            cache.data = retVal;
        });
    });
}

