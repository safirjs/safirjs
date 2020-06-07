/**
 *
 * @returns {string}
 * @constructor
 */
function SafirIdGenerator() {
    if( typeof SafirIdGenerator.counter == 'undefined' ) {
        SafirIdGenerator.counter = 0;
    }
    return '_' + SafirTemplate.prefix + '_generated_id_' + SafirIdGenerator.counter++;
}

/**
 * Storage for HTMLElement custom data
 */
class SafirDomDataRegistry {

    /**
     *
     * @returns {SafirDomDataRegistry}
     */
    constructor() {
        if (!!SafirDomDataRegistry.instance) {
            return SafirDomDataRegistry.instance;
        }

        SafirDomDataRegistry.instance = this;
        this.registry = new Map();

        return this;
    }

    /**
     * Get a custom data associated with dom param if any
     * @param dom HTMLElement
     * @returns {null|Object}
     */
    get(dom) {
        let id = dom.getAttribute('id');
        if(id !== null) {
            return this.registry.get(id);
        } else {
            return null;
        }
    }

    /**
     * Set associate a custom data to an HTMLElement.
     * This function will set an ID to the if it doesn't have one yet.
     * @param dom HTMLElement
     * @param value
     */
    set(dom, value) {
        let id = dom.getAttribute('id');
        if(id == null) {
            id = SafirIdGenerator();
            dom.setAttribute('id', id);
        }
        this.registry.set(id, value);
    }

    /**
     * Preserve browser memory by deleting orphaned data
     */
    clean() {
        let orphan_data = [];
        for(let [name, _] of this.registry) {
            let elt = document.getElementById(name);
            if(elt === null) {
                orphan_data.push(name);
            }
        }
        if(orphan_data.length > 0) {
            for(let i = 0; i < orphan_data.length; ++i) {
                this.registry.delete(orphan_data[i]);
            }
        }
    }
}