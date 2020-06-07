class SafirOption {

    static registry = {};

    constructor(options) {
        this.values = options || {};
    }

    getOptions() {
        return this.values;
    }

    merge(options) {
        if (options !== undefined) {
            for (let name in options) {
                let value = options[name];
                if (!this.values.hasOwnProperty(name)) {
                    this.values[name] = value;
                } else {
                    this.mergeWith(this.values[name], value);
                }
            }
        }
    }

    mergeWith(dest, options) {
        if (Array.isArray(dest)) { // merge array
            if (Array.isArray(options)) {
                dest = dest.concat(options);
            } else {
                dest.push(options);
            }
        } else if (typeof dest === 'object' && dest !== null) { // merge object
            for (let name in options) {
                let value = options[name];
                if (!dest.hasOwnProperty(name)) {
                    dest[name] = value;
                } else {
                    this.mergeWith(dest[name], value);
                }
            }
        } else { // merge scalar
            dest = options;
        }
    }

    get(name) {
        return this.values.hasOwnProperty(name) ? this.values[name] : undefined;
    }

    set(name, value) {
        this.values[name] = value;
    }

    static unload(selector) {
        return SafirOption.registry.hasOwnProperty(selector) ? SafirOption.registry[selector] : undefined;
    }

    static load(selector, options) {
        SafirOption.registry[selector] = options;
    }
}