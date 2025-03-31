'use strict';

let tracking = false;
let clickData = []; // Array to store click data
let inputText = 'default'; // Default value for inputText
let sanitizedInputText = 'default'; // Default value for sanitizedInputText
const injectedTabs = new Set();
let lastLoggedClick = null; // Store the last logged click

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  if (request.type === 'START') {
    console.log('START request received.');

    const sessionId = generateSessionId();
    chrome.storage.local.set({ tracking: true, sessionId, inputText }, () => {
      console.log('Tracking state set to true with session ID:', sessionId);
    });

    // Save the "Started" state in storage
    chrome.storage.local.set({ tracking: true, inputText }, () => {
      console.log('Tracking state set to true.');
    });
    inputText = request.payload.inputText;
    // Sanitize the inputText to create a valid folder name
    sanitizedInputText = inputText
      .replace(/[^a-zA-Z0-9-_ ]/g, '') // Remove invalid characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 100); // Limit to 100 characters
    // Query the active tab to get its title and URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      console.log('Active tab URL:', activeTab.url);
      const metadata = JSON.stringify({
        websiteName: activeTab?.title || 'Unknown Title',
        url: activeTab?.url || 'Unknown URL',
        inputText: inputText,
        browserName: navigator.userAgent,
      }, null, 2);

      const txtDataUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(metadata)}`;
      const timeCode = new Date().toISOString().replace(/:/g, '').replace(/\..+/, '').replace(/-/g, '');
      console.log('Time code:', timeCode);

      // Use the chrome.downloads API to save the metadata file
      chrome.downloads.download(
        {
          url: txtDataUrl,
          filename: `CACOO/${sanitizedInputText}/metadata-${timeCode}.txt`,
          conflictAction: 'overwrite',
          saveAs: false,
        },
        (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error('Error creating metadata.txt:', chrome.runtime.lastError.message);
            sendResponse({ message: 'Error creating metadata.txt' });
          } else {
            console.log('metadata.txt created with downloadId:', downloadId);
            sendResponse({ message: 'Tracking started!' });
          }
        }
      );
    });

    // Start tracking clicks
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        console.error('No active tab found.');
        return;
      }

      const activeTab = tabs[0];
      const url = activeTab.url || '';
      if (!url.startsWith('https://')) {
        console.warn('Extension only runs on HTTPS pages. Current URL:', url);
        return;
      }

      chrome.tabs.sendMessage(activeTab.id, { type: 'START_TRACKING_CLICKS', sessionId }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending START_TRACKING_CLICKS message:', chrome.runtime.lastError.message);
        } else if (response && response.message) {
          console.log(response.message);
        } else {
          console.warn('No response received from content script.');
        }
      });
    });

    return true; // Keep the message channel open for asynchronous responses
  } else if (request.type === 'STOP') {
    console.log('STOP request received.');
    // Stop tracking clicks
    chrome.storage.local.get('sessionId', (data) => {
      const sessionId = data.sessionId;
  
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
          console.error('No active tab found.');
          return;
        }
  
        const activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, { type: 'STOP_TRACKING_CLICKS', sessionId }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error sending STOP_TRACKING_CLICKS message:', chrome.runtime.lastError.message);
          } else if (response && response.message) {
            console.log(response.message);
          }
        });
      });
  
      chrome.storage.local.set({ tracking: false, sessionId: null }, () => {
        console.log('Tracking state set to false and session ID cleared.');
      });
    });
    // Retrieve the inputText from storage
    chrome.storage.local.get('inputText', (data) => {
      const inputText = data.inputText || 'default';

      // Sanitize the inputText to create a valid folder name
      const sanitizedInputText = inputText
        .replace(/[^a-zA-Z0-9-_ ]/g, '') // Remove invalid characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 100); // Limit to 100 characters

      // Stop tracking clicks
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
          console.error('No active tab found.');
          return;
        }

        const activeTab = tabs[0];
        const url = activeTab.url || '';
        if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
          console.warn('Cannot interact with restricted pages:', url);
          return;
        }

        // Check if the content script is active
        chrome.scripting.executeScript(
          {
            target: { tabId: activeTab.id },
            func: () => !!window.chrome.runtime, // Check if the content script is active
          },
          (results) => {
            if (chrome.runtime.lastError || !results || !results[0].result) {
              console.warn('Content script not active. Re-injecting...');
              chrome.scripting.executeScript(
                {
                  target: { tabId: activeTab.id },
                  files: ['contentScript.js'],
                },
                () => {
                  if (chrome.runtime.lastError) {
                    console.error('Error injecting content script:', chrome.runtime.lastError.message);
                  } else {
                    console.log('Content script re-injected.');
                    sendStopMessage(activeTab.id);
                  }
                }
              );
            } else {
              sendStopMessage(activeTab.id);
            }
          }
        );
      });

      // Save click data to a CSV file
      const csvContent = generateCSV(clickData);
      const csvDataUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
      const timeCode = new Date().toISOString().replace(/:/g, '').replace(/\..+/, '').replace(/-/g, '');

      chrome.downloads.download(
        {
          url: csvDataUrl,
          filename: `CACOO/${sanitizedInputText}/clicks-${timeCode}.csv`,
          conflictAction: 'overwrite',
          saveAs: false,
        },
        (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error('Error creating clicks.csv:', chrome.runtime.lastError.message);
            sendResponse({ message: 'Error creating clicks.csv' }); // Ensure response is sent
          } else {
            console.log('clicks.csv created with downloadId:', downloadId);
            sendResponse({ message: 'Tracking stopped!' }); // Ensure response is sent
          }

          console.log('Saving CSV with clickData:', clickData); // Debugging: Check the array before clearing
          clickData = [];

          // Clear the "Started" state in storage
          chrome.storage.local.set({ tracking: false }, () => {
            console.log('Tracking state set to false.');
          });
        }
      );
    });

    return true; // Keep the message channel open for asynchronous responses
  } else if (request.type === 'LOG_CLICK') {
    console.log('LOG_CLICK message received:', request.payload);

    // Check if the new click is identical to the last logged click (ignoring sequence number)
    const isDuplicate =
      lastLoggedClick &&
      lastLoggedClick.tagName === request.payload.tagName &&
      lastLoggedClick.id === request.payload.id &&
      lastLoggedClick.className === request.payload.className &&
      lastLoggedClick.innerText === request.payload.innerText &&
      lastLoggedClick.pageUrl === request.payload.pageUrl;

    if (isDuplicate) {
      console.warn('Duplicate click detected. Skipping logging.');
      sendResponse({ message: 'Duplicate click skipped.' });
      return true;
    }

    // Log the new click
    const sequenceNumber = clickData.length + 1;
    clickData.push({ sequenceNumber, ...request.payload });
    lastLoggedClick = request.payload; // Update the last logged click
    console.log('Logged click:', request.payload);
    console.log('Current clickData:', clickData);

    sendResponse({ message: 'Click logged successfully.' });
    return true;
  }
});

// Helper function to generate CSV content
function generateCSV(data) {
  const headers = ['Sequence', 'Tag Name', 'ID', 'Class Name', 'Inner Text', 'Page URL'];
  const rows = data.map((item) =>
    [item.sequenceNumber, item.tagName, item.id, item.className, item.innerText, item.pageUrl].join(',')
  );
  const csvContent = [headers.join(','), ...rows].join('\n');
  console.log('Generated CSV content:', csvContent); // Debugging: Check the CSV content
  return csvContent;
}

// Helper function to generate a unique session ID
function generateSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to inject content script and start tracking clicks
function injectContentScriptAndStartTracking(tabId) {
  chrome.storage.local.get('sessionId', (data) => {
    const sessionId = data.sessionId;
    if (!sessionId) {
      console.error('No session ID found. Cannot start tracking.');
      return;
    }

    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError || !tab) {
        console.error('Error retrieving tab or tab no longer exists:', chrome.runtime.lastError?.message);
        return;
      }

      const url = tab.url || '';
      if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
        console.warn('Cannot inject content script into restricted pages:', url);
        return;
      }

      setTimeout(() => {
        // Inject the overlay script
        chrome.scripting.executeScript(
          {
            target: { tabId },
            func: addOverlay, // Function to add the overlay
          },
          () => {
            if (chrome.runtime.lastError) {
              console.error('Error injecting overlay script:', chrome.runtime.lastError.message);
            } else {
              console.log('Overlay script injected into tab:', tabId);
            }
          }
        );

        // Inject the content script
        chrome.scripting.executeScript(
          {
            target: { tabId },
            files: ['contentScript.js'],
          },
          () => {
            if (chrome.runtime.lastError) {
              console.error('Error injecting content script:', chrome.runtime.lastError.message);
            } else {
              console.log('Content script injected into tab:', tabId);

              chrome.tabs.sendMessage(tabId, { type: 'START_TRACKING_CLICKS', sessionId }, (response) => {
                if (chrome.runtime.lastError) {
                  console.error('Error sending START_TRACKING_CLICKS message:', chrome.runtime.lastError.message);
                } else if (response && response.message) {
                  console.log(response.message);
                } else {
                  console.warn('No response received from content script.');
                }
              });
            }
          }
        );
      }, 1000); // Delay by 1000ms
    });
  });
}

// Function to add the overlay for letting the page load
function addOverlay() {
  // Check if the overlay already exists
  if (document.getElementById('tracking-overlay')) {
    console.warn('Overlay already exists. Skipping creation.');
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = 'tracking-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
  overlay.style.zIndex = '999999';
  overlay.style.pointerEvents = 'none'; // Prevent interaction with the overlay itself
  document.body.appendChild(overlay);

  // Check if the page is already loaded
  if (document.readyState === 'complete') {
    console.log('Page already loaded. Removing overlay immediately.');
    overlay.remove();
  } else {
    // Remove the overlay when the page is fully loaded
    window.addEventListener('load', () => {
      const overlay = document.getElementById('tracking-overlay');
      if (overlay) {
        overlay.remove();
        console.log('Overlay removed after page load.');
      }
    });
  }
}

// Add overlay before navigation starts
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (!details.tabId) {
    console.warn('Invalid tab ID:', details.tabId);
    return;
  }

  chrome.storage.local.get('tracking', (data) => {
    if (data.tracking) {
      console.log('Navigation started. Adding overlay to tab:', details.tabId);

      // Inject the overlay script
      chrome.scripting.executeScript(
        {
          target: { tabId: details.tabId },
          func: addOverlay, // Function to add the overlay
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error('Error injecting overlay script:', chrome.runtime.lastError.message);
          } else {
            console.log('Overlay added to tab before navigation:', details.tabId);
          }
        }
      );
    }
  });
});

// Update listeners to use the helper function
chrome.webNavigation.onCompleted.addListener((details) => {
  if (!details.tabId) {
    console.warn('Invalid tab ID:', details.tabId);
    return;
  }

  chrome.storage.local.get('tracking', (data) => {
    if (data.tracking) {
      console.log('Navigated to:', details.url || '');

      // Re-inject content script and reinitialize click tracking
      injectContentScriptAndStartTracking(details.tabId);
    }
  });
});

chrome.tabs.onCreated.addListener((tab) => {
  console.log('New tab created:', tab);

  chrome.storage.local.get('tracking', (data) => {
    if (data.tracking) {
      console.log('Tracking is enabled. Waiting for tab to load:', tab.id);

      chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
        if (tabId === tab.id && changeInfo.status === 'complete') {
          console.log('New tab finished loading:', tabId);

          // Inject content script and start tracking
          injectContentScriptAndStartTracking(tabId);

          // Remove the listener for this tab
          chrome.tabs.onUpdated.removeListener(listener);
        }
      });
    }
  });
});

// Helper function to send the STOP_TRACKING_CLICKS message
function sendStopMessage(tabId) {
  chrome.tabs.sendMessage(tabId, { type: 'STOP_TRACKING_CLICKS' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error sending STOP_TRACKING_CLICKS message:', chrome.runtime.lastError.message);
    } else if (response && response.message) {
      console.log(response.message);
    } else {
      console.warn('No response received from content scripts.');
    }
  });
}
