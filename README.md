# Time-Submit

A simple script which takes in data from the TSheets API, parses it to split between days, and fills in the form of a proprietary system to track time.

## Setup

1. Add the API Add-on to TSheets
3. Add an app and generate a token for your user
4. Go to chrome://extensions
5. View details and open extension settings
6. Fill in token, user ID, and job IDs (comma separated)

## Disclaimer
The portions of this extension which submit time to my employer use their proprietary system. It fills in fields as a standard user would (via content script) and assists the user in deciding information to go in free fields, but does not directly communicate with any of the infrastructure of my employer. The extension also does not gather or send any personal employee data, and only the week start and end dates leave the sandbox of the tab. The user must be logged in to the internal system with a valid session to submit time, and without being logged in this system the submitting portions of this extension are useless.

Many of the decisions in this tool were made to ensure that the security of internal systems is maintained without revealing personal or operational information.
