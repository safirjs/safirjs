/**
 * Handle element than can listen events
 * @class SafirEventTarget
 * @author liva Ramarolahy
 */

class SafirEventListener extends SafirObject {

    /**
     *
     * @param selector
     */
    constructor(selector) {
        super();
        if (selector instanceof Element) {
            this.elt = selector;
        } else {
            this.elt = document.querySelector(selector);
        }
        if (this.elt) {
            let prototypes = this.listPrototypes('on_');
            prototypes.forEach(function (p, index) {
                let name = p.substr(3);
                this.elt.addEventListener(name, this[p].bind(this));
            }, this);
        }
    }
}