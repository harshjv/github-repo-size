/* global fetch */

const API = 'https://api.github.com/repos/'

function getUsernameWithReponameFromGithubURL (url) {
  var parser = document.createElement('a')
  parser.href = url
  var repoURL = parser.pathname.substring(1).split('/')
  return repoURL[0] + '/' + repoURL[1]
}

function formatKiloBytes (bytes) {
  if (bytes === 0) {
    return {
      size: 0,
      measure: 'Bytes'
    }
  }

  bytes *= 1024

  const K = 1024
  const MEASURE = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(K))

  return {
    size: parseFloat((bytes / Math.pow(K, i)).toFixed(2)),
    measure: MEASURE[i]
  }
}

function checkStatus (response) {
  if (response.status >= 200 && response.status < 300) {
    return response
  }

  throw Error(`GitHub returned a bad status: ${response.status}`)
}

function parseJSON (response) {
  if (response) {
    return response.json()
  }

  throw Error('Could not parse JSON')
}

function getRepoSize (repo, callback) {
  fetch(API + repo)
    .then(checkStatus)
    .then(parseJSON)
    .then(data => callback(data && data.size))
    .catch(e => console.error(e))
}

var ns = document.querySelector('ul.numbers-summary')

if (ns !== null) {
  getRepoSize(getUsernameWithReponameFromGithubURL(window.location.href), function (size) {
    if (size) {
      const humanReadableSize = formatKiloBytes(size)
      const html = '<li>' +
        '<a>' +
        '<svg class="octicon octicon-database" aria-hidden="true" height="16" version="1.1" viewBox="0 0 12 16" width="12">' +
        '<path d="M6 15c-3.31 0-6-.9-6-2v-2c0-.17.09-.34.21-.5.67.86 3 1.5 5.79 1.5s5.12-.64 5.79-1.5c.13.16.21.33.21.5v2c0 1.1-2.69 2-6 2zm0-4c-3.31 0-6-.9-6-2V7c0-.11.04-.21.09-.31.03-.06.07-.13.12-.19C.88 7.36 3.21 8 6 8s5.12-.64 5.79-1.5c.05.06.09.13.12.19.05.1.09.21.09.31v2c0 1.1-2.69 2-6 2zm0-4c-3.31 0-6-.9-6-2V3c0-1.1 2.69-2 6-2s6 .9 6 2v2c0 1.1-2.69 2-6 2zm0-5c-2.21 0-4 .45-4 1s1.79 1 4 1 4-.45 4-1-1.79-1-4-1z"></path>' +
        '</svg>' +
        '<span class="num text-emphasized"> ' +
        humanReadableSize.size +
        '</span> ' +
        humanReadableSize.measure +
        '</a>' +
        '</li>'
      ns.insertAdjacentHTML('beforeend', html)
    }
  })
}
