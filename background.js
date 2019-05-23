/**
 * @file Entry point for background scripts, allows module syntax in other scripts. See main.js for functionality
 */

const script = document.createElement('script');
script.setAttribute('type', 'module');
script.setAttribute('src', chrome.extension.getURL('main.js'));
const head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
head.insertBefore(script, head.lastChild);