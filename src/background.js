/* global chrome, alert, prompt, confirm */

const GITHUB_TOKEN_KEY = 'x-github-token'
const TOKEN_FEATURE_INFORMATION_KEY = 'user-knows-token-feature'

const setGithubToken = (key, cb) => {
  const obj = {}

  obj[GITHUB_TOKEN_KEY] = key

  chrome.storage.sync.set(obj, () => {
    alert('Your Github token has been set successfully. Reload the Github page to see changes.')

    cb()
  })
}

const handleOldGithubToken = (cb) => {
  chrome.storage.sync.get(GITHUB_TOKEN_KEY, (storedData) => {
    const oldGithubToken = storedData[GITHUB_TOKEN_KEY]

    if (oldGithubToken) {
      if (confirm('You have already set your Github token. Do you want to remove it?')) {
        chrome.storage.sync.remove(GITHUB_TOKEN_KEY, () => {
          alert('You have successfully removed Github token. Click extension icon again to set a new token.')

          cb(false)
        })
      } else {
        cb(false)
      }
    } else {
      cb(true)
    }
  })
}

const userNowKnowsAboutGithubTokenFeature = (cb) => {
  const obj = {}
  obj[TOKEN_FEATURE_INFORMATION_KEY] = true

  chrome.storage.sync.set(obj, cb)
}

const informUserAboutGithubTokenFeature = () => {
  chrome.storage.sync.get(TOKEN_FEATURE_INFORMATION_KEY, (storedData) => {
    const userKnows = storedData[TOKEN_FEATURE_INFORMATION_KEY]

    if (!userKnows) {
      if (confirm('GitHub Repository Size now supports private repositories through Github personal access tokens. Do you want to add a token?')) {
        askGithubToken(() => {
          userNowKnowsAboutGithubTokenFeature(() => {})
        })
      } else {
        userNowKnowsAboutGithubTokenFeature(() => {
          alert('You can click extension icon to set a token.')
        })
      }
    }
  })
}

const askGithubToken = (cb) => {
  const githubToken = prompt('Please enter your Github token')

  if (githubToken) {
    setGithubToken(githubToken, cb)
  } else {
    alert('You have entered an empty token.')

    cb()
  }
}

chrome.browserAction.onClicked.addListener((tab) => {
  handleOldGithubToken((askToSetToken) => {
    if (askToSetToken) {
      askGithubToken(() => {})
    }
  })
})

informUserAboutGithubTokenFeature()
