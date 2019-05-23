/**
 * @file Main background script, delegates to message handlers
 */

import submitTime from './handlers/submit.js';
import getCurrentStatus from './handlers/get_current_status.js';
import updateNotes from './handlers/update_notes.js';
import {clockIn, clockOut} from './handlers/clock_in_out.js';

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
    return true;
})