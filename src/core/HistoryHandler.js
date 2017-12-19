export default class HistoryHandler {
	popped = false;
	href = null;
	initialUrl = null;
	initialState = null;

	constructor(naja) {
		this.naja = naja;

		naja.addEventListener('init', this.initialize.bind(this));
		naja.addEventListener('interaction', this.configureMode.bind(this));
		naja.addEventListener('before', this.saveUrl.bind(this));
		naja.addEventListener('success', this.pushNewState.bind(this));

		this.popStateHandler = this.handlePopState.bind(this);
		this.historyAdapter = {
			replaceState: (data, title, url) => window.history.replaceState(data, title, url),
			pushState: (data, title, url) => window.history.pushState(data, title, url),
		};
	}

	initialize() {
		this.popped = !!window.history.state;
		this.initialUrl = window.location.href;

		window.addEventListener('popstate', this.popStateHandler);

		this.historyAdapter.replaceState(this.initialState = {
			href: window.location.href,
			title: window.document.title,
			ui: this.findSnippets(),
		}, window.document.title, window.location.href);
	}

	handlePopState(e) {
		const state = e.state || this.initialState;
		const initialPop = !this.popped && this.initialUrl === state.href;
		this.popped = true;

		if (initialPop) {
			return;
		}

		if (state.ui) {
			this.handleSnippets(state.ui);
			this.handleTitle(state.title);
		}
	}

	saveUrl({url}) {
		this.href = url;
	}

	configureMode({element, options}) {
		// propagate mode to options
		options.history = this.constructor.normalizeMode(element.getAttribute('data-naja-history'));
	}

	static normalizeMode(mode) {
		if (mode === 'off' || mode === false) {
			return false;

		} else if (mode === 'replace') {
			return 'replace';
		}

		return true;
	}

	pushNewState({response, options}) {
		const mode = this.constructor.normalizeMode(options.history);
		if (mode === false) {
			return;
		}

		if (response.postGet && response.url) {
			this.href = response.url;
		}

		const method = response.replaceHistory || mode === 'replace' ? 'replaceState' : 'pushState';
		this.historyAdapter[method]({
			href: this.href,
			title: window.document.title,
			ui: this.findSnippets(),
		}, window.document.title, this.href);

		this.href = null;
		this.popped = true;
	}

	findSnippets() {
		const result = {};
		const snippets = window.document.querySelectorAll('[id^="snippet-"]');
		for (let i = 0; i < snippets.length; i++) {
			const snippet = snippets.item(i);
			if (!snippet.getAttribute('data-naja-history-nocache') && !snippet.getAttribute('data-history-nocache')) {
				result[snippet.id] = snippet.innerHTML;
			}
		}

		return result;
	}

	handleSnippets(snippets) {
		this.naja.snippetHandler.updateSnippets(snippets, true);
		this.naja.scriptLoader.loadScripts(snippets);
		this.naja.load();
	}

	handleTitle(title) {
		window.document.title = title;
	}
}
