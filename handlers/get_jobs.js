import formatGetParams from '../helpers/formatGetParams.js';

/**
 * A request to get job IDs
 * @typedef {Object} JobsRequest
 * @property {string} token                 - Token to use to get jobs, saved value if blank
 * @property {number} userId                - User ID to get jobs for, saved ID if blank
 */

/**
 * Sends an API request to the TSheets API to clock in
 * @param {object} request                  - The request information
 * @param {JobsRequest} request.getJobs    - If this is at the root of the object this will run
 * @param {*} _sender                       - Unused, the sender of the request
 * @param {function} sendResponse           - Callback for the response
 */
function getJobs(request, _sender, sendResponse) {
    console.log('Message: Getting Jobs');

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

        var data = {
            user_ids: items.tsheets_user_id,
            supplemental_data: 'yes',
            active: 'yes'
        }

        fetch('https://rest.tsheets.com/api/v1/jobcode_assignments' + formatGetParams(data), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + items.tsheets_token
            }
        }).then(response => {
            if (!response.ok) {
                sendResponse({error: {
                    statusCode: response.status,
                    message: 'Got response with code ' + response.status
                }})

                throw new Error("Bad response code");
            } else {
                return response.json();
            }
        }).then(response => {
                var jobs = [];
                for (var assignment in response.results.jobcode_assignments) {
                    var job = response.supplemental_data.jobcodes[response.results.jobcode_assignments[assignment].jobcode_id];
                    jobs.push({
                        id: job.id,
                        name: job.name,
                        type: job.type
                    })
                }
                sendResponse({
                    jobs: jobs
                });
        });
    });
}

export default getJobs;