var infoEl = document.createElement('div');
document.getElementsByTagName('body')[0].appendChild(infoEl);

var clockedInEl = document.getElementById('is_clocked_in')
var shiftTimeEl = document.querySelector('#shift_time .data');
var shiftSpanEl = document.getElementById('shift_span')
var shiftNotesEl = document.getElementById('shift_notes')
var shiftNotesInput = shiftNotesEl.getElementsByTagName('textarea')[0]

var clockInButton = document.getElementById('clock_in')
var clockOutButton = document.getElementById('clock_out')

var blurWarningEl = document.getElementById('blur_warning');

var timesheetId = null; // Store the active timesheet
var notesEdited = false;

heartbeat();
var repeat = setInterval(heartbeat, 3000);

// Don't spam the network when the popup is closed
window.onblur = () => {clearInterval(repeat); console.log("BLURRED. Will no longer update."); setTimeout(() => {blurWarningEl.style.display = 'block'; setTimeout(() => blurWarningEl.style.opacity = 1, 10)}, 300)}
window.onfocus = () => {clearInterval(repeat); repeat = setInterval(heartbeat, 3000); console.log("Got focus. Updates resumed."); blurWarningEl.style.display = 'none'; blurWarningEl.style.opacity = 0}

function heartbeat() {
    console.log("Heartbeat")
    chrome.runtime.sendMessage({getNow: {}}, (response) => {
        console.log(response)
        if (response) {
            if (response.error) {
                console.error(response.error.message);
                clearInterval(repeat);
            } else if (response.onCooldown) {
                console.log('cooling down')
            } else {
                timesheetId = response.status.timesheetId;

                if (response.status.clockedIn) {
                    clockedInEl.innerText = "Clocked In"
                    clockedInEl.className = "alert alert-success"

                    clockInButton.style.display = "none"
                } else {
                    clockedInEl.innerText = "Clocked Out"
                    clockedInEl.className = "alert alert-warning"

                    clockOutButton.style.display = "none"
                }
                shiftTimeEl.innerText = response.status.shift_time

                if (!notesEdited)
                    shiftNotesInput.value = response.status.shift_notes

                var start = new Date(response.status.start);
                var end = response.status.end ? new Date(response.status.end) : null;

                shiftSpanEl.innerHTML = formatTime(start) + " &ndash; " + (end ? formatTime(end) : "now")

                if (document.getElementsByTagName('body')[0].style.display === "none") document.getElementsByTagName('body')[0].style.display = "block"
            }
        }
    });
}

function formatTime(date) {
    var timeWithAmPm = date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
    // Slice off AM/PM
    return timeWithAmPm.substr(0, timeWithAmPm.length-3)
}

var typingTimer;                //timer identifier
var doneTypingInterval = 2000;  //time in ms

//on keyup, start the countdown
shiftNotesEl.onkeyup = () => {
    notesEdited = true;
  clearTimeout(typingTimer);
  typingTimer = setTimeout(doneTyping, doneTypingInterval);
}

//on keydown, clear the countdown 
shiftNotesEl.onkeydown = () => {
  clearTimeout(typingTimer);
}

//user is "finished typing," do something
function doneTyping () {
    console.log(timesheetId)
    console.log("done")
    if (timesheetId) {
        chrome.runtime.sendMessage({updateNotes: {
            timesheetId: timesheetId,
            notes: shiftNotesInput.value}
        }, (response) => {
            notesEdited = false;
            if (response.error) {
                var errorAlert = document.createElement('div');
                errorAlert.className = 'alert alert-danger';
                errorAlert.innerText = response.error.message;
                shiftNotesEl.appendChild(errorAlert);
            } else {
                // Tell the user it saved
                shiftNotesEl.querySelector('.saved').style.opacity = 1;
                setTimeout(() => {shiftNotesEl.querySelector('.saved').style.opacity = 0}, 3000);
            }
        });
        
    }
}