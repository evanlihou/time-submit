import getCurrentStatus from './get_current_status.js';

function setIconStatus(existingResp) {
    chrome.windows.getCurrent((window) => {
        if (window.focused) {
            // Only call off to the API of we're actually in focus
            console.log('Message: Setting icon!')
            if (existingResp) {
                handleStatusResponse(existingResp);
            } else {
                getCurrentStatus(null,null,handleStatusResponse);
            }
        } else {
            chrome.browserAction.setBadgeText({text: ''});
        }
    })
}

function handleStatusResponse(resp) {
    if (resp.status) {
        if (resp.status.clockedIn) {
            chrome.browserAction.setBadgeText({text: resp.status.shift_time});
        } else {
            chrome.browserAction.setBadgeText({text: "out"});
        }
    }
}

export default setIconStatus;