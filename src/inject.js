/* global fetch, Request, Headers, chrome, localStorage */

const API = 'https://api.github.com/repos/'
const LI_TAG_ID = 'github-repo-size'
const GITHUB_TOKEN_KEY = 'x-github-token'

const storage = chrome.storage.sync || chrome.storage.local

let githubToken

const isTree = (uri) => {
  const repoURI = uri.split('/')

  return repoURI.length === 2 || repoURI[2] === 'tree'
}

const getRepoInfoURI = (uri) => {
  const repoURI = uri.split('/')

  return repoURI[0] + '/' + repoURI[1]
}

const getRepoContentURI = (uri) => {
  const repoURI = uri.split('/')
  const treeBranch = repoURI.splice(2, 2, 'contents')

  if (treeBranch && treeBranch[1]) {
    repoURI.push('?ref=' + treeBranch[1])
  }

  return repoURI.join('/')
}

const getHumanReadableSizeObject = (bytes) => {
  if (bytes === 0) {
    return {
      size: 0,
      measure: 'Bytes'
    }
  }

  const K = 1024
  const MEASURE = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(K))

  return {
    size: parseFloat((bytes / Math.pow(K, i)).toFixed(2)),
    measure: MEASURE[i]
  }
}

const getHumanReadableSize = (size) => {
  if (!size) return ''

  const t = getHumanReadableSizeObject(size)

  return t.size + ' ' + t.measure
}

const getSizeHTML = (size) => {
  const humanReadableSize = getHumanReadableSizeObject(size)

  return '<li id="' + LI_TAG_ID + '">' +
    '<svg class="octicon octicon-database" aria-hidden="true" height="16" version="1.1" viewBox="0 0 12 16" width="12">' +
    '<path d="M6 15c-3.31 0-6-.9-6-2v-2c0-.17.09-.34.21-.5.67.86 3 1.5 5.79 1.5s5.12-.64 5.79-1.5c.13.16.21.33.21.5v2c0 1.1-2.69 2-6 2zm0-4c-3.31 0-6-.9-6-2V7c0-.11.04-.21.09-.31.03-.06.07-.13.12-.19C.88 7.36 3.21 8 6 8s5.12-.64 5.79-1.5c.05.06.09.13.12.19.05.1.09.21.09.31v2c0 1.1-2.69 2-6 2zm0-4c-3.31 0-6-.9-6-2V3c0-1.1 2.69-2 6-2s6 .9 6 2v2c0 1.1-2.69 2-6 2zm0-5c-2.21 0-4 .45-4 1s1.79 1 4 1 4-.45 4-1-1.79-1-4-1z"></path>' +
    '</svg>' +
    '<span class="num text-emphasized"> ' +
    humanReadableSize.size +
    '</span> ' +
    humanReadableSize.measure +
    '</li>'
}

const checkStatus = (response) => {
  if (response.status >= 200 && response.status < 300) {
    return response
  }

  throw Error(`GitHub returned a bad status: ${response.status}`)
}

const parseJSON = (response) => {
  if (response) {
    return response.json()
  }

  throw Error('Could not parse JSON')
}

const getAPIData = (uri, callback) => {
  const headerObj = {
    'User-Agent': 'harshjv/github-repo-size'
  }

  const token = localStorage.getItem(GITHUB_TOKEN_KEY) || githubToken

  if (token) {
    headerObj['Authorization'] = 'token ' + token
  }

  const request = new Request(API + uri, {
    headers: new Headers(headerObj)
  })

  fetch(request)
    .then(checkStatus)
    .then(parseJSON)
    .then(callback)
    .catch(e => console.error(e))
}

const getFileName = (text) => text.trim().split('/')[0]

const checkForRepoPage = () => {
  let repoURI = window.location.pathname.substring(1)
  repoURI = repoURI.endsWith('/') ? repoURI.slice(0, -1) : repoURI

  if (isTree(repoURI)) {
    const ns = document.querySelector('ul.numbers-summary')
    const liElem = document.getElementById(LI_TAG_ID)
    const tdElems = document.querySelector('span.github-repo-size-td')

    if (ns && !liElem) {
      getAPIData(getRepoInfoURI(repoURI), (data) => {
        if (data && data.size) {
          ns.insertAdjacentHTML('beforeend', getSizeHTML(data.size * 1024))
        }
      })
    }

    if (!tdElems) {
      getAPIData(getRepoContentURI(repoURI), (data) => {
        const sizeArray = {}

        for (const item of data) {
          sizeArray[item.name] = item.type !== 'dir' ? item.size : null
        }

        const list = document.querySelectorAll('table > tbody tr.js-navigation-item:not(.up-tree)')
        const files = document.querySelectorAll('table > tbody tr.js-navigation-item:not(.up-tree) td.content a')
        const ageForReference = document.querySelectorAll('table > tbody tr.js-navigation-item:not(.up-tree) td:last-child')

        let i = 0

        for (const file of files) {
          const t = sizeArray[getFileName(file.text)]

          const td = document.createElement('td')
          td.className = 'age'
          td.innerHTML = '<span class="css-truncate css-truncate-target github-repo-size-td">' + getHumanReadableSize(t) + '</span>'

          list[i].insertBefore(td, ageForReference[i++])
        }
      })
    }
  }
}

storage.get(GITHUB_TOKEN_KEY, function (data) {
  githubToken = data[GITHUB_TOKEN_KEY]

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes[GITHUB_TOKEN_KEY]) {
      githubToken = changes[GITHUB_TOKEN_KEY].newValue
    }
  })

  document.addEventListener('pjax:end', checkForRepoPage, false)

  checkForRepoPage()
})
