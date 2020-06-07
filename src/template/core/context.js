/**
 *
 */
class SafirTemplateContext {
    /**
     * Create a new context instance
     * @param data
     */
    constructor(data) {
        this.data = data || {};
    }

    /**
     *
     * @param name
     * @returns {*|{}}
     */
    get(name) {
        let paths = name.split('.');
        let current = this.data;
        while (paths.length > 0) {
            let key = paths.shift();
            current = current[key];
            if (current === undefined) {
                break;
            }
        }
        return current;
    }

    /**
     *
     * @param name
     * @param value
     */
    set(name, value) {
        this.data[name] = value;
    }
}
