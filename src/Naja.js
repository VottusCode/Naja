import qwest from 'qwest';
import objectAssign from 'object-assign';
import EventTarget from 'event-target-shim';

import UIHandler from './core/UIHandler';
import SnippetHandler from './core/SnippetHandler';
import RedirectHandler from './core/RedirectHandler';


export default class Naja extends EventTarget {
	initialized = false;

	uiHandler = null;
	snippetHandler = null;
	redirectHandler = null;
	extensions = [];

	initialize() {
		if (this.initialized) {
			throw new Error("Cannot initialize Naja, it is already initialized.");
		}

		this.uiHandler = new UIHandler(this);
		this.snippetHandler = new SnippetHandler(this);
		this.redirectHandler = new RedirectHandler(this);

		this.fireEvent('init');
		this.initialized = true;
		this.load();
	}


	load() {
		this.fireEvent('load');
	}


	fireEvent(type, args = {}) {
		const evt = Object.assign(args, {type, cancelable: true});
		return this.dispatchEvent(evt);
	}


	makeRequest(method, url, data, options) {
		const defaultOptions = {
			dataType: 'post',
			responseType: 'auto',
		};

		options = objectAssign({}, defaultOptions, options || {});

		let currentXhr;
		const beforeCallback = xhr => {
			currentXhr = xhr;
			this.fireEvent('before', {xhr, method, url, data, options});
		};

		const request = qwest.map(method, url, data, options, beforeCallback)
			.then((xhr, response) => {
				this.fireEvent('success', {xhr, response});
				this.fireEvent('complete', {error: null, xhr, response});
				this.load();
			})
			.catch((error, xhr, response) => {
				this.fireEvent('error', {error, xhr, response});
				this.fireEvent('complete', {error, xhr, response});
				this.load();
			});

		this.fireEvent('start', {request, xhr: currentXhr});
		return request;
	}
}