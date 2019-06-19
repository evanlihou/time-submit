export default function updateNotes(request, _sender, sendResponse) {
    console.log('Message: Updating notes');
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
                id: request.updateNotes.timesheetId,
                notes: request.updateNotes.notes
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