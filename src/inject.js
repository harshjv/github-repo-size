/* global fetch, Request, Headers, chrome, localStorage */

const API = 'https://api.github.com/repos/'
const NAV_ELEM_ID = 'github-repo-size'
const GITHUB_TOKEN_KEY = 'x-github-token'

const storage = chrome.storage.sync || chrome.storage.local

let githubToken

const getRepoObject = () => {
  // find file button
  const elem = document.querySelector('a.d-none.js-permalink-shortcut')
  if (!elem) return false

  if (!elem.href ||
      !elem.href.match(/^https?:\/\/github.com\//)) {
    return false
  }

  const repoUri = elem.href.replace(/^https?:\/\/github.com\//, '')
  const arr = repoUri.split('/')

  const userOrg = arr.shift()
  const repoName = arr.shift()
  const repo = `${userOrg}/${repoName}`

  arr.shift() // tree

  const ref = arr.shift()

  return {
    repo,
    ref,
    currentPath: arr.join('/').trim()
  }
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

  return `
<li class="d-flex" id="${NAV_ELEM_ID}">
  <a class="js-selected-navigation-item UnderlineNav-item hx_underlinenav-item no-wrap js-responsive-underlinenav-item" data-tab-item="settings-tab" style="cursor: pointer">
    <svg class="octicon octicon-gear UnderlineNav-octicon d-none d-sm-inline" display="none inline" aria-hidden="true" height="16" version="1.1" viewBox="0 0 12 16" width="12">
    <path d="M6 15c-3.31 0-6-.9-6-2v-2c0-.17.09-.34.21-.5.67.86 3 1.5 5.79 1.5s5.12-.64 5.79-1.5c.13.16.21.33.21.5v2c0 1.1-2.69 2-6 2zm0-4c-3.31 0-6-.9-6-2V7c0-.11.04-.21.09-.31.03-.06.07-.13.12-.19C.88 7.36 3.21 8 6 8s5.12-.64 5.79-1.5c.05.06.09.13.12.19.05.1.09.21.09.31v2c0 1.1-2.69 2-6 2zm0-4c-3.31 0-6-.9-6-2V3c0-1.1 2.69-2 6-2s6 .9 6 2v2c0 1.1-2.69 2-6 2zm0-5c-2.21 0-4 .45-4 1s1.79 1 4 1 4-.45 4-1-1.79-1-4-1z"></path>
    </svg>
    <span data-content="Settings">${humanReadableSize.size} ${humanReadableSize.measure}</span>
  </a>
</li>
`
}

const checkStatus = (response) => {
  if (response.status >= 200 && response.status < 300) {
    return response
  }

  console.error(response)

  throw Error(`GitHub returned an invalid status: ${response.status}`)
}

const getAPIData = (uri) => {
  const headerObj = {
    'User-Agent': 'harshjv/github-repo-size'
  }

  const token = localStorage.getItem(GITHUB_TOKEN_KEY) || githubToken

  if (token) {
    headerObj.Authorization = 'token ' + token
  }

  const request = new Request(`${API}${uri}`, {
    headers: new Headers(headerObj)
  })

  return fetch(request)
    .then(checkStatus)
    .then(response => response.json())
}

const getFileName = text => text.trim().split('/')[0]

const checkForRepoPage = async () => {
  const repoObj = getRepoObject()
  if (!repoObj) return

  // wait for the table to load
  await new Promise((resolve, reject) => {
    function loading () {
      return !!document.querySelector('div[role="gridcell"] div.Skeleton')
    }

    if (!loading()) return resolve()

    const interval = setInterval(() => {
      if (!loading()) {
        clearInterval(interval)
        resolve()
      }
    }, 100)
  })

  const ns = document.querySelector('ul.UnderlineNav-body')
  const navElem = document.getElementById(NAV_ELEM_ID)
  const tdElems = document.querySelector('span.github-repo-size-div')

  if (ns && !navElem) {
    getAPIData(repoObj.repo).then(summary => {
      if (summary && summary.size) {
        ns.insertAdjacentHTML('beforeend', getSizeHTML(summary.size * 1024))
        const newLiElem = document.getElementById(NAV_ELEM_ID)
        newLiElem.title = 'Click to load directory sizes'
        newLiElem.style.cssText = 'cursor: pointer'
        newLiElem.onclick = loadDirSizes
      }
    })
  }

  if (tdElems) return

  const tree = await getAPIData(`${repoObj.repo}/contents/${repoObj.currentPath}?ref=${repoObj.ref}`)
  const sizeObj = { '..': '..' }

  tree.forEach(item => {
    sizeObj[item.name] = item.type !== 'dir' ? item.size : 'dir'
  })

  const list = [...document.querySelectorAll('div[role="row"].Box-row')]
  const items = [...document.querySelectorAll('div[role="row"].Box-row div[role="rowheader"] a')]
  const ageForReference = document.querySelectorAll('div[role="row"].Box-row div[role="gridcell"]:last-child')

  items.forEach((item, index) => {
    const filename = getFileName(item.text)
    const t = sizeObj[filename]

    const div = document.createElement('div')
    div.setAttribute('role', 'gridcell')

    div.style.cssText = 'width: 80px'
    div.className = 'text-gray-light text-right mr-3'

    let label

    if (t === 'dir') {
      label = '&middot;&middot;&middot;'
      div.className += ' github-repo-size-dir'
      div.title = 'Click to load directory size'
      div.style.cssText = 'cursor: pointer; width: 80px'
      div.onclick = loadDirSizes
      div.setAttribute('data-dirname', filename)
    } else if (t === '..') {
      label = ''
    } else {
      label = getHumanReadableSize(t)
    }

    div.innerHTML = `<span class="css-truncate css-truncate-target d-block width-fit github-repo-size-div">${label}</span>`

    list[index].insertBefore(div, ageForReference[index])
  })
}

const loadDirSizes = async () => {
  const files = [...document.querySelectorAll('div[role="row"].Box-row div[role="rowheader"] a')]
  const dirSizes = [...document.querySelectorAll('div.github-repo-size-dir span')]
  const navElem = document.getElementById(NAV_ELEM_ID)

  if (navElem) {
    navElem.onclick = null
    navElem.title = 'Loading directory sizes...'
  }

  dirSizes.forEach(dir => {
    dir.textContent = '...'
    dir.parentElement.onclick = null
  })

  const repoObj = getRepoObject()
  if (!repoObj) return

  const data = await getAPIData(`${repoObj.repo}/git/trees/${repoObj.ref}?recursive=1`)

  if (data.truncated) {
    console.warn('github-repo-size: Data truncated. Directory size info may be incomplete.')
  }

  const sizeObj = {}

  data.tree.forEach(item => {
    if (!item.path.startsWith(repoObj.currentPath)) return

    const arr = item.path
      .replace(new RegExp(`^${repoObj.currentPath}`), '')
      .replace(/^\//, '')
      .split('/')

    if (arr.length >= 2 && item.type === 'blob') {
      const dir = arr[0]
      if (sizeObj[dir] === undefined) sizeObj[dir] = 0
      sizeObj[dir] += item.size
    }
  })

  files.forEach(file => {
    const dirname = getFileName(file.text)
    const t = sizeObj[dirname]

    const dir = dirSizes.find(dir => dir.parentElement.getAttribute('data-dirname') === dirname)

    if (dir) {
      dir.textContent = getHumanReadableSize(t)
    }
  })

  if (navElem) {
    navElem.title = 'Directory sizes loaded successfully'
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
