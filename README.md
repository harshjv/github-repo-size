# 🚀 Chrome extension to display repository size on GitHub [![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/) [![Chrome Web Store](https://img.shields.io/chrome-web-store/v/apnjnioapinblneaedefcnopcjepgkci.svg)](https://chrome.google.com/webstore/detail/github-repository-size/apnjnioapinblneaedefcnopcjepgkci) [![Chrome Web Store](https://img.shields.io/chrome-web-store/d/apnjnioapinblneaedefcnopcjepgkci.svg)](https://chrome.google.com/webstore/detail/github-repository-size/apnjnioapinblneaedefcnopcjepgkci)


Automatically adds repository size to GitHub's repository summary.


## Screenshot

![Screenshot of repository size on GitHub](https://raw.githubusercontent.com/harshjv/github-repo-size/master/screenshot.png)


## Private Repository

Generate a Github personal access token from [here](https://github.com/settings/tokens) and click on extension icon to add it.

### Override token for some time

You can set `x-github-token` in `localStorage` to your access token, and the extension will use this value even if you've previously set token.

    localStorage.setItem('x-github-token', <YOUR-PERSONAL-ACCESS-TOKEN>)

and then remove it to use previously set token;

    localStorage.removeItem('x-github-token')


## Installation

[![Install from chrome web store](https://developer.chrome.com/webstore/images/ChromeWebStore_Badge_v2_340x96.png)](https://chrome.google.com/webstore/detail/github-repository-size/apnjnioapinblneaedefcnopcjepgkci)

Install extension from [Chrome Web Store](https://chrome.google.com/webstore/detail/github-repository-size/apnjnioapinblneaedefcnopcjepgkci)


## Development

1. Clone this repo
2. Go to chrome extensions [chrome://extensions](chrome://extensions)
3. Enable developer mode
4. Click on load unpacked extension and select this cloned repo


## License

MIT
