(() => {
  let currentSessionId = null;
  let trackingClicks = false;

  // Function to handle button clicks
  function handleClick(event) {
    if (!trackingClicks) return;

    const clickedElement = event.target;
    if (!clickedElement || !clickedElement.tagName) return;

    const elementInfo = {
      tagName: clickedElement.tagName,
      id: clickedElement.id || 'No ID',
      className: clickedElement.className || 'No Class',
      innerText: clickedElement.innerText ? clickedElement.innerText.trim().substring(0, 50) : 'No Text',
      pageUrl: window.location.href,
    };

    chrome.runtime.sendMessage({ type: 'LOG_CLICK', payload: elementInfo }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending click data:', chrome.runtime.lastError.message);
      }
    });
  }

  // Function to handle copy events
  function handleCopy(event) {
    const copiedText = window.getSelection().toString();
    if (!copiedText) return;

    const copyInfo = {
      action: 'copy',
      text: copiedText,
      pageUrl: window.location.href,
    };

    chrome.runtime.sendMessage({ type: 'LOG_COPY', payload: copyInfo }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending copy data:', chrome.runtime.lastError.message);
      }
    });
  }

  // Function to handle paste events
  function handlePaste(event) {
    const pastedText = (event.clipboardData || window.clipboardData).getData('text');
    if (!pastedText) return;

    const pasteInfo = {
      action: 'paste',
      text: pastedText,
      pageUrl: window.location.href,
    };

    chrome.runtime.sendMessage({ type: 'LOG_PASTE', payload: pasteInfo }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending paste data:', chrome.runtime.lastError.message);
      }
    });
  }

  // Function to intercept the next method call
  function interceptNextMethod() {
    // Assuming the method is part of a global object (e.g., `odoo`)
    const originalMethod = odoo.someModel.someMethod; // Replace with the actual model and method

    odoo.someModel.someMethod = function (...args) {
      console.log('Intercepted method call:', {
        methodName: 'someMethod',
        modelName: 'someModel', // Replace with the actual model name
        parameters: args,
      });

      // Send the method details to the background script
      chrome.runtime.sendMessage({
        type: 'LOG_METHOD_CALL',
        payload: {
          methodName: 'someMethod',
          modelName: 'someModel',
          parameters: args,
        },
      });

      // Restore the original method after interception
      odoo.someModel.someMethod = originalMethod;

      // Call the original method
      return originalMethod.apply(this, args);
    };
  }

  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'START_TRACKING_CLICKS') {
      if (currentSessionId && currentSessionId !== request.sessionId) {
        console.warn('Ignoring START_TRACKING_CLICKS for a different session:', request.sessionId);
        return;
      }

      currentSessionId = request.sessionId;
      console.log('Started tracking clicks for session:', currentSessionId);

      trackingClicks = true;
      document.removeEventListener('click', handleClick, true);
      document.addEventListener('click', handleClick, true);

      document.removeEventListener('copy', handleCopy, true);
      document.addEventListener('copy', handleCopy, true);

      document.removeEventListener('paste', handlePaste, true);
      document.addEventListener('paste', handlePaste, true);

      sendResponse({ message: 'Click, copy, and paste tracking started.' });
    } else if (request.type === 'STOP_TRACKING_CLICKS') {
      if (currentSessionId !== request.sessionId) {
        console.warn('Ignoring STOP_TRACKING_CLICKS for a different session:', request.sessionId);
        return;
      }

      console.log('Stopped tracking clicks for session:', currentSessionId);

      trackingClicks = false;
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('copy', handleCopy, true);
      document.removeEventListener('paste', handlePaste, true);

      sendResponse({ message: 'Click, copy, and paste tracking stopped.' });
    }
  });

  // Example: Intercept button clicks and method calls
  document.addEventListener('click', (event) => {
    const target = event.target;

    // Check if the clicked element is a button
    if (target.tagName.toLowerCase() === 'button') {
      console.log('Button clicked:', target);

      // Capture button details
      const buttonDetails = {
        tagName: target.tagName,
        id: target.id || null,
        className: target.className || null,
        innerText: target.innerText || null,
      };

      // Send button details to the background script
      chrome.runtime.sendMessage({
        type: 'LOG_BUTTON_CLICK',
        payload: buttonDetails,
      });

      // Intercept the next method call (example for Odoo)
      interceptNextMethod();
    }
  });
})();

