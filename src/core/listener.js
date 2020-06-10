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
    apply(selector) {
        let element = null;
        if (selector instanceof Element) {
            element = selector;
        } else {
            element = document.querySelector(selector);
        }
        if (element instanceof Element) {
            let prototypes = this.listPrototypes('on_');
            prototypes.forEach(function (p, index) {
                let name = p.substr(3);
                element.addEventListener(name, this[p].bind(this));
            }, this);
        } else {
            console.error('SafirEventListener', 'Element with selector [' + selector + '] not found');
        }
    }
}