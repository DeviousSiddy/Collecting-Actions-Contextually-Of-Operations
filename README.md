# <img src="public/icons/icon_48.png" width="45" align="left"> Collecting Actions Contextually On Operation

A Chrome Extension designed to collect and manage actions contextually within websites.

## Features

- **Contextual Action Collection**: Automatically collects actions based on user interactions within the Odoo platform.
- **User-Friendly Interface**: Easy-to-use interface for managing and viewing collected actions.
- **Real-Time Updates**: Keeps track of actions in real-time, providing up-to-date information.
- **Copy and Paste Tracking**: Tracks copy and paste actions performed on the website.
- **CSV Export**: Exports collected data (clicks, copy, and paste actions) to a CSV file for further analysis.

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/DeviousSiddy/Collecting-Actions-Contextually-Of-Operations.git

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Build the Extension**:
   ```bash
   npm run build
   ```

4. **Load the Extension in Chrome**:
   - Open [chrome://extensions](chrome://extensions).
   - Enable "Developer mode" (top right of the page).
   - Click "Load unpacked" and select the `build/` directory.

## Usage

1. **Start Tracking**:
   - Click the extension icon in the Chrome toolbar to open the popup.
   - Enter a text description in the input field and click "Start" to begin tracking clicks, copy, and paste actions.

2. **Interact with the Website**:
   - Perform actions such as clicking buttons, copying text, or pasting text on the website. The extension will log these actions in real-time.

3. **Stop Tracking**:
   - Click "Stop" in the popup to end tracking. The collected data will be saved as a CSV file in the `Downloads` folder.

4. **View Collected Data**:
   - The CSV file will include details such as the action type (`click`, `copy`, `paste`), the element clicked, copied text, pasted text, and the page URL.

## Contribution

Contributions are welcome! Please follow these steps to contribute:
1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes and push them to your fork.
4. Submit a pull request with a detailed description of your changes.

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgements

- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [Webpack](https://webpack.js.org/)
- [Odoo](https://www.odoo.com/)
