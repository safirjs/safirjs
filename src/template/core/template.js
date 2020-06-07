/**
 *
 */
class SafirTemplate {
    /**
     *
     * @type {string}
     */
    static prefix = '';

    /**
     *
     * @type {string}
     */
    static namespace = 'https://github.com/safirjs/safirjs';

    /**
     *
     * @param selector
     */
    constructor(selector) {
        let parser = new SafirTemplateParser();
        this.node = parser.parse(selector);
    }

    /**
     *
     * @param target
     * @param data
     */
    render(target, data) {

        if (!(target instanceof Element)) {
            target = document.querySelector(target);
        }
        this.node.render(target, data);

        safir.init(target);
    }
}