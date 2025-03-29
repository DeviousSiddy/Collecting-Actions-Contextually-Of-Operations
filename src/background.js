'use strict';

const path = require('path');
const os = require('os');

let tracking = false;
let folderPath = '';

// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GREETINGS') {
    console.log('Message received in background:', request.payload.message);
    sendResponse({ message: 'Hello from the background script!' });
  } else if (request.type === 'COUNT') {
    console.log(`Count received: ${request.payload.count}`);
    sendResponse({ message: 'Count processed in background!' });
  } else if (request.type === 'START') {
    const inputText = request.payload.inputText;
    const documentsPath = path.join(os.homedir(), 'Documents', 'MyExtension');
    if (!fs.existsSync(documentsPath)) {
      fs.mkdirSync(documentsPath, { recursive: true });
    }

    // Find the next 16-digit folder name
    let folderNumber = 0;
    const existingFolders = fs.readdirSync(documentsPath).filter((name) =>
      /^\d{16}$/.test(name)
    );
    if (existingFolders.length > 0) {
      folderNumber = Math.max(...existingFolders.map(Number)) + 1;
    }
    folderPath = path.join(documentsPath, folderNumber.toString().padStart(16, '0'));
    fs.mkdirSync(folderPath);

    // Create the TXT file
    const txtFilePath = path.join(folderPath, 'metadata.txt');
    const metadata = `URL: ${sender.tab.url}\nTitle: ${sender.tab.title}\nInput: ${inputText}`;
    fs.writeFileSync(txtFilePath, metadata);

    // Start tracking
    tracking = true;
    sendResponse({ message: 'Tracking started!' });
  } else if (request.type === 'STOP') {
    tracking = false;
    sendResponse({ message: 'Tracking stopped!' });
  } else if (request.type === 'LOG_METHOD' && tracking) {
    const csvFilePath = path.join(folderPath, 'methods.csv');
    const methodName = request.payload.methodName;

    // Append method name to CSV
    fs.appendFileSync(csvFilePath, `${methodName}\n`);
  }
  return true; // Keep the message channel open for asynchronous responses
});
