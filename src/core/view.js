/**
 * Handle basic view component
 * @class SafirView
 * @author liva Ramarolahy
 */
class SafirView extends SafirEventTarget {
    constructor(selector, options) {
        super(selector, options);

        if (this.elt) {
            this._setupViewID();
            this.elt.setAttributeNS(SafirTemplate.namespace, SafirTemplate.prefix + ':view', true);

            this.registerListeners();
        } else {
            console.error('View element not found', selector);
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

class SafirViewBuilder {

    /**
     *
     * @param selector
     * @param options
     */
    static setup(selector, options) {
        let elements = document.querySelectorAll(selector);
        elements.forEach(function (element, index) {
            if (!element.hasAttributeNS(SafirTemplate.namespace, 'view')) {
                // let view = new LView(element, options);
                Reflect.construct(SafirView, [element, options]);
            }
        });
    }
}
