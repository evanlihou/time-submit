/**
 * A request to clock in/out
 * @typedef {Object} ClockRequest
 * @property {number} timesheetId           - Which timesheet to clock out of
 */

/**
 * Sends an API request to the TSheets API to clock in
 * @param {object} request                  - The request information
 * @param {ClockRequest} request.clockIn    - If this is at the root of the object this will run
 * @param {*} _sender                       - Unused, the sender of the request
 * @param {function} sendResponse           - Callback for the response
 */
function clockIn(request, _sender, sendResponse) {
    console.log('Clocking in');

}

/**
 * 
 * @param {object} request                  - The request informtion
 * @param {ClockRequest} request.clockOut   - If this is at the root of the object this will run
 * @param {*} _sender                       - Unused, sender of the request
 * @param {function} sendResponse           - Callback for the response
 */
function clockOut(request, _sender, sendResponse) {
    console.log('Clocking out');

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
            data: [{
                id: request.clockOut.timesheetId,
                end: new moment().format('Y-MM-DDTHH:mm:ssZ'),
                origin_hint_end: 'Timetrack Chrome Extension'
            }]
        });

        fetch('https://rest.tsheets.com/api/v1/timesheets', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + items.tsheets_token
            },
            body: data
        }).then(response => {
            console.log('Got response with code ' + response.status);
            if (response.status !== 200) {
                sendResponse({error: {
                    statusCode: response.status,
                    message: 'Got response with code ' + response.status
                }})
            } else {
                sendResponse({success: ''});
            }
        });
    });
}

export {clockIn, clockOut}