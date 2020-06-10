/**
 * Handle element than can be targeted by events
 * @class SafirEventTarget
 * @author liva Ramarolahy
 */

class SafirEventTarget extends SafirObject {

    /**
     *
     * @type {Map<string, SafirEventTarget>}
     */
    static registry = new Map();

    constructor(selector) {
        super();

        this.event_listeners = new Map();

        if (selector instanceof Element) {
            this.elt = selector;
        } else {
            this.elt = document.querySelector(selector);
        }

        if (this.elt instanceof Element) {
            this.setupId();
            if (SafirEventTarget.registry.has(this.elt.id)) {
                return SafirEventTarget.registry.get(this.elt.id);
            } else {
                SafirEventTarget.registry.set(this.elt.id, this);
            }
        } else {
            console.error('SafirEventTarget', 'Element with selector [' + selector + '] not found');
        }
    }

    /**
     * Generate a new ID if missing
     */
    setupId() {
        if (this.elt.hasAttribute('id')) {
            let elt_id = this.elt.getAttribute('id');
            if (elt_id.trim() !== '') {
                this.id = elt_id;
            } else {
                this.elt.setAttribute('id', this.id);
            }
        } else {
            this.elt.setAttribute('id', this.id);
        }
    }

    /**
     * Add an event listener to the current target. This method ensure that each type of listener is added only once
     * by maintaining the list of listeners in the instance.
     * @param listener
     */
    addEventListener(listener) {
        try {
            listener = Reflect.construct(listener, [this.elt]);
        } catch (e) {
            console.error(e);
        }

        if (listener instanceof SafirEventListener) {
            let constructor = listener.constructor.name;
            if (!this.event_listeners.has(constructor)) {
                listener.target = this.elt;
                listener.apply(this.elt);
                this.event_listeners.set(constructor, listener);
            }
        } else {
            console.error(listener.constructor.name + ' IS NOT an instance of SafirEventListener');
            console.log(listener);
        }
    }
}
