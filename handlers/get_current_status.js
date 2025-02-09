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

        var start = new Date()
        start.setHours(-24*start.getDay());

        var end = new Date(new Date(start).setDate(start.getDate()+6))

        var tsheets_headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + items.tsheets_token
        };
        
        var apiCallPromises = [
            fetch('https://rest.tsheets.com/api/v1/reports/current_totals', {
                method: 'POST',
                headers: tsheets_headers,
                body: JSON.stringify({
                    data: {
                        on_the_clock: 'both',
                        user_ids: items.tsheets_user_id
                    }
                })
            }).then(resp=>resp.json()),
            fetch('https://rest.tsheets.com/api/v1/reports/payroll', {
                method: 'POST',
                headers: tsheets_headers,
                body: JSON.stringify({
                    data: {
                        user_ids: items.tsheets_user_id,
                        start_date: start.toISODateString(),
                        end_date: end.toISODateString()
                    }
                })
            }).then(resp=>resp.json())
        ]

        Promise.all(apiCallPromises).then(([current_totals_response, payroll_response]) => {
            if (current_totals_response.supplemental_data.timesheets)
                var timesheet = current_totals_response.supplemental_data.timesheets[current_totals_response.results.current_totals[items.tsheets_user_id].timesheet_id];
            
            var weekTotalSeconds = 0;
            weekTotalSeconds += payroll_response.results.payroll_report[items.tsheets_user_id] ? payroll_response.results.payroll_report[items.tsheets_user_id].total_work_seconds : 0;
            weekTotalSeconds += current_totals_response.results.current_totals[items.tsheets_user_id].shift_seconds;

            var retVal = {
                status: {
                    timesheetId: current_totals_response.results.current_totals[items.tsheets_user_id].timesheet_id,
                    clockedIn: current_totals_response.results.current_totals[items.tsheets_user_id].on_the_clock,
                    start: timesheet ? timesheet.start : null,
                    end: timesheet ? timesheet.end : null,
                    shift_time: secondsToHumanReadable(current_totals_response.results.current_totals[items.tsheets_user_id].shift_seconds),
                    shift_notes: timesheet ? timesheet.notes : null
                },
                totals: {
                    week: secondsToHumanReadable(weekTotalSeconds),
                    day: secondsToHumanReadable(current_totals_response.results.current_totals[items.tsheets_user_id].day_seconds)
                }
            }

            if (retVal.status.clockedIn) {
                retVal.status.jobName = current_totals_response.supplemental_data.jobcodes[timesheet.jobcode_id].name
            }

            var fieldItemPromises = [];
            if (current_totals_response.results.current_totals[items.tsheets_user_id].on_the_clock && timesheet && timesheet.customfields && current_totals_response.supplemental_data.customfields ) {
                retVal.customFields = {}

                for (let [key, val] of Object.entries(timesheet.customfields)) {
                    var fieldInfo = current_totals_response.supplemental_data.customfields[key];
                    retVal.customFields[key] = {
                        name: fieldInfo.name,
                        shortCode: fieldInfo.short_code,
                        type: fieldInfo.ui_preference,
                        value: val
                    }
                    if (fieldInfo.ui_preference === 'drop_down') {
                        // Get options
                        retVal.customFields[key].options = [];
                        fieldItemPromises.push(fetch('https://rest.tsheets.com/api/v1/customfielditems?customfield_id=' + key, {
                            method: 'GET',
                            headers: tsheets_headers
                        }).then(resp => resp.json()).then(resp => {
                            for (let [_, opt] of Object.entries(resp.results.customfielditems))
                            retVal.customFields[key].options.push({
                                id: opt.id,
                                text: opt.name
                            });
                        }));
                        
                    }
                }
            }
            Promise.all(fieldItemPromises).then(() => {
                console.log(retVal)
                sendResponse(retVal)
                if (request !== null && request.getNow.updateIcon === true) {
                    setIconStatus(retVal);
                }
                cache.data = retVal;
            });
        });
    });
}

// Helper to convert the number of seconds returned by TSheets into a format
// that's easy to display
function secondsToHumanReadable(seconds) {
    var numMinutes = Math.round(seconds / 60) % 60;
    var numHours = Math.floor(seconds / 60 / 60);
    return numHours + ":" + (numMinutes < 10 ? "0"+numMinutes : numMinutes);
}

Date.prototype.toISODateString = function () {
    return this.toISOString().slice(0,10);
}

