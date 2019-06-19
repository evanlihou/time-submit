/**
 * @file Logic for the time info browser action popup
 */

class TimeInfo {
    constructor() {
        
        this.shiftSpanEl = document.getElementById('shift_span')
        this.shiftNotesEl = document.getElementById('shift_notes')
        this.shiftNotesInput = this.shiftNotesEl.getElementsByTagName('textarea')[0]

        this.confirmModalEl = document.getElementById('confirm_modal');
        this.confirmModal = new Modal(this.confirmModalEl, {});

        this.clockInButton = document.getElementById('clock_in')
        this.clockInConfirmButton = document.getElementById('clock_in_confirm')

        this.clockOutButton = document.getElementById('clock_out')
        
        this.blurWarningEl = document.getElementById('blur_warning');

        this.timesheetId = null; // Store the active timesheet
        this.notesEdited = false;

        this.isClockedIn = null;

        this.heartbeat();
        this.repeat = setInterval(this.heartbeat, 3000);

        // Don't spam the network when the popup is closed
        window.onblur = () => {
            clearInterval(this.repeat);
            console.log('BLURRED. Will no longer update.');
            setTimeout(() => {
                this.blurWarningEl.style.display = 'block';
                setTimeout(() => this.blurWarningEl.style.opacity = 1, 10)
            }, 300)
        }

        window.onfocus = () => {
            clearInterval(this.repeat);
            this.repeat = setInterval(this.heartbeat.bind(this), 3000);
            console.log('Got focus. Updates resumed.');
            this.blurWarningEl.style.display = 'none';
            this.blurWarningEl.style.opacity = 0;
        }

        var typingTimer;                //timer identifier
        var doneTypingInterval = 2000;  //time in ms

        //on keyup, start the countdown
        this.shiftNotesEl.onkeyup = () => {
            this.notesEdited = true;
            clearTimeout(typingTimer);
            typingTimer = setTimeout(this.doneTyping.bind(this), doneTypingInterval);
        }

        //on keydown, clear the countdown 
        this.shiftNotesEl.onkeydown = () => {
            clearTimeout(typingTimer);
        }

        this.shiftNotesInput.onblur = () =>{
            // If textarea loses focus, immediately save changes
            if (this.notesEdited) {
                clearTimeout(typingTimer);
                this.doneTyping();
            }
        }

        this.confirmModalEl.addEventListener('shown.bs.modal', (e) => {
            if (this.isClockedIn) {
                this.confirmModal.setContent(`
                <div class="modal-header">
                    <h5 class="modal-title">Clock Out</h5>
                </div>
                <div class="modal-body">
                    Are you sure you want to clock out?
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-warning" id="clock_out_confirm">Confirm</button>
                </div>
                `);
                var clockOutConfirmButton = document.getElementById('clock_out_confirm')
                clockOutConfirmButton.onclick = () => {
                    chrome.runtime.sendMessage({clockOut: {timesheetId: this.timesheetId}}, (response) => {
                        if (!response.error) this.confirmModal.hide();
                    });
                    }
            } else {
                this.confirmModal.setContent(`
                <div class="modal-header">
                    <h5 class="modal-title">Clock In</h5>
                </div>
                <div class="modal-body">
                    Select assignment to clock in to.
                    <select id="jobs-select"></select>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-warning" id="clock_in_confirm">Confirm</button>
                </div>
                `);
                
                var clockInConfirmButton = document.getElementById('clock_in_confirm')
                clockInConfirmButton.onclick = () => {
                    var jobId = document.getElementById('jobs-select').value;
                    chrome.runtime.sendMessage({clockIn: {jobId: jobId}}, (response) => {
                        if (!response.error) this.confirmModal.hide();
                    });
                }
                var jobsSelectEl = document.getElementById('jobs-select');
                chrome.runtime.sendMessage({getJobs: {updateIcon: true}}, (resp) => {
                    for (var job of resp.jobs) {
                        var optionEl = document.createElement('option');
                        optionEl.value = job.id;
                        optionEl.text = job.name;
                        jobsSelectEl.appendChild(optionEl);
                    }
                })
            }
        });
    }

    heartbeat() {
        console.log('Heartbeat')
        chrome.runtime.sendMessage({getNow: {updateIcon: true}}, (response) => {
            if (response) {
                if (response.error) {
                    console.error(response.error.message);
                    clearInterval(this.repeat);
                } else if (response.isCached === true) {
                    console.log('Got a cached response')
                }

                this.timesheetId = response.status.timesheetId;

                var isClockedInEl = document.getElementById('is_clocked_in')
                this.isClockedIn = response.status.clockedIn;
                if (response.status.clockedIn) {
                    isClockedInEl.innerText = 'Clocked In'
                    isClockedInEl.className = 'alert alert-success'
                    
                    this.clockInButton.style.display = 'none'
                    this.clockOutButton.style.display = 'block'
                } else {
                    isClockedInEl.innerText = 'Clocked Out'
                    isClockedInEl.className = 'alert alert-warning'

                    this.clockOutButton.style.display = 'none'
                    this.clockInButton.style.display = 'block'
                }

                var shiftTimeEl = document.querySelector('#shift_time .data');
                shiftTimeEl.innerText = response.status.shift_time

                if (response.status.timesheetId) {
                    if (!this.notesEdited)
                    this.shiftNotesInput.value = response.status.shift_notes

                    var start = new Date(response.status.start);
                    var end = response.status.end ? new Date(response.status.end) : null;

                    this.shiftSpanEl.innerHTML = this.formatTime(start) + ' &ndash; ' + (end ? this.formatTime(end) : 'now')

                    if (shiftTimeEl.parentElement.style.display === 'none') shiftTimeEl.parentElement.style.display = 'block';
                    if (this.shiftNotesEl.style.display === 'none') this.shiftNotesEl.style.display = 'block';
                } else {
                    shiftTimeEl.parentElement.style.display = 'none';
                    this.shiftNotesEl.style.display = 'none';
                }

                var body = document.getElementsByTagName('body')[0];
                if (body.style.display === 'none') body.style.display = 'block'
            }
        });
    }

    formatTime(date) {
        var timeWithAmPm = date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
        // Slice off AM/PM
        return timeWithAmPm.substr(0, timeWithAmPm.length-3)
    }

    //user is finished typing, do something
    doneTyping () {
        console.log('User finished typing, handling notes update')
        if (this.timesheetId) {
            chrome.runtime.sendMessage({updateNotes: {
                timesheetId: this.timesheetId,
                notes: this.shiftNotesInput.value}
            }, (response) => {
                this.notesEdited = false;
                if (response.error) {
                    var errorAlert = document.createElement('div');
                    errorAlert.className = 'alert alert-danger';
                    errorAlert.innerText = response.error.message;
                    this.shiftNotesEl.appendChild(errorAlert);
                } else {
                    // Tell the user it saved
                    this.shiftNotesEl.querySelector('.saved').style.opacity = 1;
                    setTimeout(() => {this.shiftNotesEl.querySelector('.saved').style.opacity = 0}, 3000);
                }
            });
            
        }
    }
}