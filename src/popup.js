'use strict';

import './popup.css';

document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('startButton');
  const stopButton = document.getElementById('stopButton');
  const inputTextField = document.getElementById('inputText');
  const statusText = document.getElementById('statusText');

  // Initialize the popup state
  chrome.storage.local.get(['tracking', 'inputText'], (data) => {
    if (data.tracking) {
      statusText.textContent = 'Status: Started';
      startButton.disabled = true;
      stopButton.disabled = false;
      inputTextField.value = data.inputText || '';
      inputTextField.readOnly = true;
    } else {
      statusText.textContent = 'Status: Stopped';
      startButton.disabled = false;
      stopButton.disabled = true;
      inputTextField.value = data.inputText || '';
      inputTextField.readOnly = false;
    }
  });

  // Start button click handler
  startButton.addEventListener('click', () => {
    const inputText = inputTextField.value.trim();
    if (!inputText) {
      alert('Please enter some text before starting.');
      return;
    }

    chrome.runtime.sendMessage({ type: 'START', payload: { inputText } }, (response) => {
      if (response && response.message === 'Tracking started!') {
        statusText.textContent = 'Status: Started';
        startButton.disabled = true;
        stopButton.disabled = false;
        inputTextField.readOnly = true;

        chrome.storage.local.set({ tracking: true, inputText });
      } else {
        console.error('Failed to start tracking:', response);
      }
    });
  });

  // Stop button click handler
  stopButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'STOP' }, (response) => {
      if (response && response.message === 'Tracking stopped!') {
        statusText.textContent = 'Status: Stopped';
        startButton.disabled = false;
        stopButton.disabled = true;
        inputTextField.readOnly = false;

        chrome.storage.local.set({ tracking: false });
      } else {
        console.error('Failed to stop tracking:', response);
      }
    });
  });
});
