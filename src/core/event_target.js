/**
 * Handle element than can be targeted by events
 * @class SafirEventTarget
 * @author liva Ramarolahy
 */

class SafirEventTarget {

    constructor(selector, options) {
        this.options = new SafirOption(options);

        if (selector instanceof Element) {
            this.elt = selector;
        } else {
            this.elt = document.querySelector(selector);
        }
    }

    registerListeners() {
        /**
         * Register listeners from options
         */
        let _options = this.options.getOptions();

        if (this.elt) {
            if (_options.hasOwnProperty('listeners')) {
                for (const i in _options.listeners) {
                    this.registerListener(_options.listeners[i]);
                }
            }
        }
    }

    // @TODO allow
    registerListener(listener) {
        try {
            let instance = Reflect.construct(listener, [this.elt]);
            instance.target = this;
        } catch (e) {
            console.error(e);
            console.error('Listener MUST be a constructable');
        }
    }
}
