var addDomainPermissionToggle = (function () {
	'use strict';

	function NestedProxy(target) {
		return new Proxy(target, {
			get(target, prop) {
				if (typeof target[prop] !== 'function') {
					return new NestedProxy(target[prop]);
				}
				return (...arguments_) =>
					new Promise((resolve, reject) => {
						target[prop](...arguments_, result => {
							if (chrome.runtime.lastError) {
								reject(new Error(chrome.runtime.lastError.message));
							} else {
								resolve(result);
							}
						});
					});
			}
		});
	}
	const chromeP =
		typeof window === 'object' &&
		(window.browser || new NestedProxy(window.chrome));

	const patternValidationRegex = /^(https?|wss?|file|ftp|\*):\/\/(\*|\*\.[^*/]+|[^*/]+)\/.*$|^file:\/\/\/.*$|^resource:\/\/(\*|\*\.[^*/]+|[^*/]+)\/.*$|^about:/;
	const isFirefox$1 = typeof navigator === 'object' && navigator.userAgent.includes('Firefox/');
	function getRawRegex(matchPattern) {
	    if (!patternValidationRegex.test(matchPattern)) {
	        throw new Error(matchPattern + ' is an invalid pattern, it must match ' + String(patternValidationRegex));
	    }
	    let [, protocol, host, pathname] = matchPattern.split(/(^[^:]+:[/][/])([^/]+)?/);
	    protocol = protocol
	        .replace('*', isFirefox$1 ? '(https?|wss?)' : 'https?')
	        .replace(/[/]/g, '[/]');
	    host = (host !== null && host !== void 0 ? host : '')
	        .replace(/^[*][.]/, '([^/]+.)*')
	        .replace(/^[*]$/, '[^/]+')
	        .replace(/[.]/g, '[.]')
	        .replace(/[*]$/g, '[^.]+');
	    pathname = pathname
	        .replace(/[/]/g, '[/]')
	        .replace(/[.]/g, '[.]')
	        .replace(/[*]/g, '.*');
	    return '^' + protocol + host + '(' + pathname + ')?$';
	}
	function patternToRegex(...matchPatterns) {
	    if (matchPatterns.includes('<all_urls>')) {
	        return /^(https?|file|ftp):[/]+/;
	    }
	    return new RegExp(matchPatterns.map(getRawRegex).join('|'));
	}

	const isExtensionContext = typeof chrome === 'object' && chrome && typeof chrome.extension === 'object';
	const globalWindow = typeof window === 'object' ? window : undefined;
	typeof location === 'object' && location.protocol.startsWith('http');
	function isBackgroundPage() {
	    var _a, _b;
	    return isExtensionContext && (location.pathname === '/_generated_background_page.html' ||
	        ((_b = (_a = chrome.extension) === null || _a === void 0 ? void 0 : _a.getBackgroundPage) === null || _b === void 0 ? void 0 : _b.call(_a)) === globalWindow);
	}

	function getManifestPermissionsSync() {
	    return _getManifestPermissionsSync(chrome.runtime.getManifest());
	}
	function _getManifestPermissionsSync(manifest) {
	    var _a, _b;
	    const manifestPermissions = {
	        origins: [],
	        permissions: []
	    };
	    const list = new Set([
	        ...((_a = manifest.permissions) !== null && _a !== void 0 ? _a : []),
	        ...((_b = manifest.content_scripts) !== null && _b !== void 0 ? _b : []).flatMap(config => { var _a; return (_a = config.matches) !== null && _a !== void 0 ? _a : []; })
	    ]);
	    for (const permission of list) {
	        if (permission.includes('://')) {
	            manifestPermissions.origins.push(permission);
	        }
	        else {
	            manifestPermissions.permissions.push(permission);
	        }
	    }
	    return manifestPermissions;
	}

	const isFirefox = typeof navigator === 'object' && navigator.userAgent.includes('Firefox/');
	const contextMenuId = 'webext-domain-permission-toggle:add-permission';
	let globalOptions;
	async function executeCode(tabId, function_, ...args) {
	    return chromeP.tabs.executeScript(tabId, {
	        code: `(${function_.toString()})(...${JSON.stringify(args)})`
	    });
	}
	async function isOriginPermanentlyAllowed(origin) {
	    return chromeP.permissions.contains({
	        origins: [origin + '/*']
	    });
	}
	async function getTabUrl(tabId) {
	    if (isFirefox) {
	        const [url] = await executeCode(tabId, () => location.href);
	        return url;
	    }
	    const tab = await chromeP.tabs.get(tabId);
	    return tab.url;
	}
	async function updateItem(url) {
	    const settings = {
	        checked: false,
	        enabled: true
	    };
	    if (url) {
	        const origin = new URL(url).origin;
	        const manifestPermissions = getManifestPermissionsSync();
	        const isDefault = patternToRegex(...manifestPermissions.origins).test(origin);
	        settings.enabled = !isDefault;
	        settings.checked = isDefault || await isOriginPermanentlyAllowed(origin);
	    }
	    chrome.contextMenus.update(contextMenuId, settings);
	}
	async function togglePermission(tab, toggle) {
	    const safariError = 'The browser didn\'t supply any information about the active tab.';
	    if (!tab.url && toggle) {
	        throw new Error(`Please try again. ${safariError}`);
	    }
	    if (!tab.url && !toggle) {
	        throw new Error(`Couldn't disable the extension on the current tab. ${safariError}`);
	    }
	    const permissionData = {
	        origins: [
	            new URL(tab.url).origin + '/*'
	        ]
	    };
	    if (!toggle) {
	        void chromeP.permissions.remove(permissionData);
	        return;
	    }
	    const userAccepted = await chromeP.permissions.request(permissionData);
	    if (!userAccepted) {
	        chrome.contextMenus.update(contextMenuId, {
	            checked: false
	        });
	        return;
	    }
	    if (globalOptions.reloadOnSuccess) {
	        void executeCode(tab.id, (message) => {
	            if (confirm(message)) {
	                location.reload();
	            }
	        }, globalOptions.reloadOnSuccess);
	    }
	}
	async function handleTabActivated({ tabId }) {
	    void updateItem(await getTabUrl(tabId).catch(() => ''));
	}
	async function handleClick({ checked, menuItemId }, tab) {
	    if (menuItemId !== contextMenuId) {
	        return;
	    }
	    try {
	        await togglePermission(tab, checked);
	    }
	    catch (error) {
	        if (tab === null || tab === void 0 ? void 0 : tab.id) {
	            try {
	                await executeCode(tab.id, 'alert' ,
	                String(error instanceof Error ? error : new Error(error.message)));
	            }
	            catch (_a) {
	                alert(error);
	            }
	            void updateItem();
	        }
	        throw error;
	    }
	}
	function addDomainPermissionToggle(options) {
	    if (!isBackgroundPage()) {
	        throw new Error('webext-domain-permission-toggle can only be called from a background page');
	    }
	    if (globalOptions) {
	        throw new Error('webext-domain-permission-toggle can only be initialized once');
	    }
	    const { name, optional_permissions } = chrome.runtime.getManifest();
	    globalOptions = {
	        title: `Enable ${name} on this domain`,
	        reloadOnSuccess: `Do you want to reload this page to apply ${name}?`,
	        ...options
	    };
	    if (!chrome.contextMenus) {
	        throw new Error('webext-domain-permission-toggle requires the `contextMenu` permission');
	    }
	    const optionalHosts = optional_permissions === null || optional_permissions === void 0 ? void 0 : optional_permissions.filter(permission => /<all_urls>|\*/.test(permission));
	    if (!optionalHosts || optionalHosts.length === 0) {
	        throw new TypeError('webext-domain-permission-toggle some wildcard hosts to be specified in `optional_permissions`');
	    }
	    chrome.contextMenus.remove(contextMenuId, () => chrome.runtime.lastError);
	    chrome.contextMenus.create({
	        id: contextMenuId,
	        type: 'checkbox',
	        checked: false,
	        title: globalOptions.title,
	        contexts: ['page_action', 'browser_action'],
	        documentUrlPatterns: optionalHosts
	    });
	    chrome.contextMenus.onClicked.addListener(handleClick);
	    chrome.tabs.onActivated.addListener(handleTabActivated);
	    chrome.tabs.onUpdated.addListener(async (tabId, { status }, { url, active }) => {
	        if (active && status === 'complete') {
	            void updateItem(url !== null && url !== void 0 ? url : await getTabUrl(tabId).catch(() => ''));
	        }
	    });
	}

	return addDomainPermissionToggle;

}());
