const TIMESHEET_URL = "https://rest.tsheets.com/api/v1/timesheets";

chrome.runtime.onMessage.addListener(
    function(request, _sender, sendResponse) {
        if (request.getTimesheet) {
            var req = request.getTimesheet
            chrome.storage.sync.get({
                tsheets_token: '',
                tsheets_job_id: '',
                tsheets_user_id: ''
            }, (items) => {
                if (!items.tsheets_token || !items.tsheets_job_id || !items.tsheets_user_id) {
                    sendResponse({
                        error: {
                            message: 'One or more configuration values were empty. Please ensure extension options are set.'
                        }
                    })
                    return;
                }
                var params = {
                    start_date: req.start,
                    end_date: req.end,
                    user_ids: items.tsheets_user_id,
                    jobcode_ids: items.tsheets_job_id,
                    on_the_clock: 'both'
                };
                fetch(TIMESHEET_URL + formatGetParams(params), {
                    headers: {"Authorization": "Bearer " + items.tsheets_token}
                }).then(res => res.json())
                .then(response => {
                    console.log(response);
                    if (!response.results) {
                        sendResponse({
                            error: {
                                message: 'Received invalid response from TSheets.' + (response.error ? ' Error: ' + response.error.message : '')
                            }
                        })
                        return;
                    }
                    var tsData = response.results.timesheets;
                    var dateTotals = {};
                    for (var key in tsData) {
                        var value = tsData[key];
                        if (!dateTotals[value.date]) {
                            dateTotals[value.date] = {
                                seconds: 0,
                                comments: []
                            };
                        }
                        if (value.on_the_clock) {
                            // Hack: Currently assumes user's timezone is the same as the one on the timesheet. This might also break with daylight savings transitions.
                            var secondsDifference = (new Date() - new Date(value.start)) / 1000
                            dateTotals[value.date].seconds += secondsDifference;
                        } else {
                            dateTotals[value.date].seconds += value.duration;
                        }
                        if (value.notes !== "") dateTotals[value.date].comments.push(value.notes);
                    }
                    sendResponse(dateTotals);
                });
            });
            return true;
        }
    }
)

function formatGetParams(params) {
    return "?" + Object.keys(params)
        .map(function(key) {
            return key+"="+encodeURIComponent(params[key])
        }).join("&");
}