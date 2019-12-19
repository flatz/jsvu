// Copyright 2019 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the “License”);
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// <https://apache.org/licenses/LICENSE-2.0>.
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an “AS IS” BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const got = require('got');
const url = require('url');
const tunnel = require('tunnel');

const pkg = require('../package.json');

const { getStatus } = require('../shared/status.js');

const get = (url, options) => {
	const parsedUrl = new URL(url);
	const status = getStatus();

	let opts = {
		...options,
		headers: {
			'User-Agent': `${pkg.name}/${pkg.version} (+${pkg.homepage})`
		},
	};

	const hasHttpProxy = status.httpProxy !== undefined && status.httpProxy.length !== 0;
	const hasHttpsProxy = status.httpsProxy !== undefined && status.httpsProxy.length !== 0;
	const useGlobalProxy = status.globalProxy !== undefined && status.globalProxy;

	let proxyString;
	if (useGlobalProxy) {
		if (hasHttpProxy)
			proxyString = status.httpProxy;
		else if (hasHttpsProxy)
			proxyString = status.httpsProxy;
	}
	else {
		if (parsedUrl.protocol === 'https:') {
			if (hasHttpsProxy)
				proxyString = status.httpsProxy;
		}
		else {
			if (hasHttpProxy)
				proxyString = status.httpProxy;
		}
	}

	if (proxyString !== undefined) {
		const proxyUrl = new URL(proxyString);

		let proxyOpts = { host: proxyUrl.hostname };
		if (proxyUrl.port.length !== 0)
			proxyOpts.port = parseInt(proxyUrl.port, 10);
		if (proxyUrl.username.length !== 0 && proxyUrl.password.length !== 0)
			proxyOpts.proxyAuth = proxyUrl.username + ':' + proxyUrl.password;

		let method;
		if (parsedUrl.protocol === 'https:') {
			if (proxyUrl.protocol === 'https:')
				method = 'httpsOverHttps';
			else
				method = 'httpsOverHttp';
		}
		else {
			if (proxyUrl.protocol === 'https:')
				method = 'httpOverHttps';
			else
				method = 'httpOverHttp';
		}

		if (method !== undefined)
			opts.agent = tunnel[method]({ proxy: proxyOpts });
	}

	return got(url, opts);
};

module.exports = get;
