(() => {
  let currentSessionId = null;
  let trackingClicks = false;

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

      sendResponse({ message: 'Click tracking started.' });
    } else if (request.type === 'STOP_TRACKING_CLICKS') {
      if (currentSessionId !== request.sessionId) {
        console.warn('Ignoring STOP_TRACKING_CLICKS for a different session:', request.sessionId);
        return;
      }

      console.log('Stopped tracking clicks for session:', currentSessionId);

      trackingClicks = false;
      document.removeEventListener('click', handleClick, true);

      sendResponse({ message: 'Click tracking stopped.' });
    }
  });
})();

