/**
 * Handle basic element
 * @class SafirElement
 * @author liva Ramarolahy
 */
class SafirElement extends SafirEventTarget {
    constructor(selector, options) {
        super(selector, options);
        this.elt.setAttributeNS(SafirTemplate.namespace, SafirTemplate.prefix + ':view', true);
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
