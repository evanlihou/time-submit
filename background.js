const TIMESHEET_URL = "https://rest.tsheets.com/api/v1/timesheets";

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.getTimesheet) {
            var req = request.getTimesheet
            chrome.storage.sync.get({
                tsheets_token: '',
                tsheets_job_id: '',
                tsheets_user_id: ''
            }, (items) => {
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
                        dateTotals[value.date].seconds += value.duration;
                        dateTotals[value.date].comments.push(value.notes);
                    }
                    console.log('HANDLE',dateTotals);
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