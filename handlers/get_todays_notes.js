import formatGetParams from '../helpers/formatGetParams.js';

export default function getTodaysNotes(request, _sender, sendResponse) {
    console.log('Message: Getting today\'s notes');
    
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

        var start = new Date();

        var tsheets_headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + items.tsheets_token
        };
        
        fetch('https://rest.tsheets.com/api/v1/timesheets' + formatGetParams({start_date: start.toISODateString(), on_the_clock: 'both'}), {
            method: 'GET',
            headers: tsheets_headers
        }).then(resp=>resp.json()).then((response) => {
            let results = [];
            for (var timesheet_id in response.results.timesheets) {
                var timesheet = response.results.timesheets[timesheet_id];
                var note = timesheet.notes !== "" ? timesheet.notes : null;
                var job_name = null;
                if (response.supplemental_data.jobcodes[timesheet.jobcode_id] !== undefined) {
                    job_name = response.supplemental_data.jobcodes[timesheet.jobcode_id].name;
                }

                results.push({
                    job_name: job_name,
                    note: note
                })
            }

            console.log(results);
            sendResponse({
                notes: results
            });
        });
    });
}

Date.prototype.toISODateString = function () {
    return this.toISOString().slice(0,10);
}

