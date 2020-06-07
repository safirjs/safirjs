/**
 * Base class for all Safir objects
 * @class SafirObject
 * @author liva Ramarolahy
 */
class SafirObject {

    prototypes = undefined;

    /**
     * @constructor
     */
    constructor() {
    }

    listPrototypes(prefix) {
        if (this.prototypes === undefined) {
            this.prototypes = this._getPrototypes(Object.getPrototypeOf(this));
        }
        return this.prototypes.filter(function (p) {
            return p.startsWith(prefix);
        });
    }

    hasPrototype(name) {
        return this[name] !== undefined;
    }

    _getPrototypes(prototype) {

        let prototypes = Object.getOwnPropertyNames(prototype).filter(function (p) {
            return typeof prototype[p] === 'function'
        });

        let constructor = Object.getPrototypeOf(prototype.constructor);
        if (constructor.name !== 'SafirObject') {
            if (constructor.prototype) {
                let tmp = this._getPrototypes(constructor.prototype);
                prototypes = prototypes.concat(tmp);
            }
        }
        return prototypes;
    }

}
