function fillTime() {
    const weekStr = document.getElementsByName('data[week_no]')[0].value;
    const week = {
        weekNo: weekStr.substring(4,6),
        yearNo: weekStr.substring(0,4)
    }
    const weekBounds = getDateOfISOWeek(week.weekNo, week.yearNo);
    chrome.runtime.sendMessage({getTimesheet: {
        start: weekBounds.start.toISODateString(),
        end: weekBounds.end.toISODateString()
    }}, function (response) {
        if (response.error) {
            alert(response.error.message);
        } else {
            document.querySelectorAll('.timesheets').forEach(function (el, _i, _arr) {
                el.classList.remove('hide-weekends');
            });
            for (var day in response) {
                var dayIndex = new Date(day + ' EDT').getDay(); // TZ Hack
                var el = document.querySelector('input.time.regular[data-day="' + dayIndex + '"]');
                var comments = response[day].comments.join('\n');
                el.value = Math.round(response[day].seconds / 60 / 60 * 10)/10;
                el.title = comments;
                // Trigger onchange for sums
                var evt = new Event('change');
                el.dispatchEvent(evt);
            }
        }
    })
}

function getDateOfISOWeek(w, y) {
    var simple = new Date(y, 0, 1 + (w - 1) * 7);
    var dow = simple.getDay();
    var ISOweekStart = simple;
    if (dow <= 4)
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());

    // Add 6 days. TSheets will include the end date.
    var ISOweekEnd = new Date();
    ISOweekEnd.setTime(ISOweekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
    return {
        start: ISOweekStart,
        end: ISOweekEnd
    };
}

Date.prototype.toISODateString = function () {
    return this.toISOString().slice(0,10);
}

let autoFillButton = document.createElement('button');
autoFillButton.addEventListener('click', fillTime, false)
autoFillButton.innerText = 'Fill From TSheets';
autoFillButton.style.position = 'fixed';
autoFillButton.style.bottom = '5px';
autoFillButton.style.right = '5px';
document.body.appendChild(autoFillButton);