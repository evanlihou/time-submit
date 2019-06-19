/**
 * @file Main background script, delegates to message handlers
 */

import submitTime from './handlers/submit.js';
import getCurrentStatus from './handlers/get_current_status.js';
import updateNotes from './handlers/update_notes.js';
import {clockIn, clockOut} from './handlers/clock_in_out.js';
import getJobs from './handlers/get_jobs.js';
import setIconStatus from './handlers/set_icon_status.js';

chrome.runtime.onMessage.addListener((...params) => {
    if (params[0].getNow)
        getCurrentStatus(...params);
    else if (params[0].getTimesheet)
        submitTime(...params);
    else if (params[0].updateNotes)
        updateNotes(...params);
    else if (params[0].clockIn)
        clockIn(...params);
    else if (params[0].clockOut)
        clockOut(...params);
    else if (params[0].getJobs)
        getJobs(...params);
    else if (params[0].setIcon) {
        setIconStatus(...params);
    }
    return true;
})

chrome.browserAction.setBadgeBackgroundColor({color:'#000'})
setIconStatus();
setInterval(setIconStatus, 5*60*1000);