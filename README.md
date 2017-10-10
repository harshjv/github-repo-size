# 🚀 Chrome extension to display repository size on GitHub [![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/) [![Chrome Web Store](https://img.shields.io/chrome-web-store/v/apnjnioapinblneaedefcnopcjepgkci.svg)](https://chrome.google.com/webstore/detail/github-repository-size/apnjnioapinblneaedefcnopcjepgkci) [![Chrome Web Store](https://img.shields.io/chrome-web-store/d/apnjnioapinblneaedefcnopcjepgkci.svg)](https://chrome.google.com/webstore/detail/github-repository-size/apnjnioapinblneaedefcnopcjepgkci)


Automatically adds repository size to GitHub's repository summary.

[![Featured on Product Hunt](./product-hunt.png)](https://www.producthunt.com/tech/github-repository-size) [![Install from chrome web store](https://developer.chrome.com/webstore/images/ChromeWebStore_Badge_v2_340x96.png)](https://chrome.google.com/webstore/detail/github-repository-size/apnjnioapinblneaedefcnopcjepgkci)


## Screenshot

![Screenshot of repository size on GitHub](https://raw.githubusercontent.com/harshjv/github-repo-size/master/screenshot.png)


## Private Repository

To enable viewing size of private repositories;

1. Install extension from chrome webstore, if you haven't.
2. Go to https://github.com/settings/tokens to generate your personal access token.
  - Check `repo` scope to enable this extension on private repo.
3. Click on the Github Repo Size extension (this extension)'s icon aside the address bar.
4. Paste your access token there in the prompt box.

### Temporarily override then token

You can set `x-github-token` in `localStorage` to your access token, and the extension will use this value even if you've previously set token.

    localStorage.setItem('x-github-token', <YOUR-PERSONAL-ACCESS-TOKEN>)

and then remove it to use previously set token;

    localStorage.removeItem('x-github-token')


## Development

1. Clone this repo
2. Go to chrome extensions [chrome://extensions](chrome://extensions)
3. Enable developer mode
4. Click on load unpacked extension and select this cloned repo


## License

MIT
