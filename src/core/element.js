/**
 * Handle basic element
 * @class SafirElement
 * @author liva Ramarolahy
 */
class SafirElement extends SafirEventTarget {
    constructor(selector, options) {
        super(selector, options);

        if (this.elt) {
            this._setupViewID();
            this.elt.setAttributeNS(SafirTemplate.namespace, SafirTemplate.prefix + ':view', true);

            this.registerListeners();
        } else {
            console.error('Element not found', selector);
        }
    }

    /**
     *
     * @private
     */
    _setupViewID() {
        if (this.elt.hasAttribute('id')) {
            let elt_id = this.elt.getAttribute('id');
            if (elt_id.trim() !== '') {
                this.id = elt_id;
            } else {
                this.id = SafirIdGenerator();
                this.elt.setAttribute('id', this.id);
            }
        } else {
            this.id = SafirIdGenerator();
            this.elt.setAttribute('id', this.id);
        }
    }
}

class SafirElementBuilder {

    /**
     *
     * @param selector
     * @param options
     */
    static setup(selector, options) {
        let elements = document.querySelectorAll(selector);
        elements.forEach(function (element, index) {
            if (!element.hasAttributeNS(SafirTemplate.namespace, 'view')) {
                Reflect.construct(SafirElement, [element, options]);
            }
        });
    }
}
