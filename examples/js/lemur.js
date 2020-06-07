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

/**
 *
 */
class SafirTemplateNode {
    constructor(parent) {
        this.parent = parent;
        this.children = [];
        this.content = '';
        this.tmpl_attributes = new Map();
        this.html_attributes = new Map();
        this.context = new LTemplateContext();
        this.append_data = false;
    }

    /**
     *
     * @param child
     */
    addChild(child) {
        if ((child.type !== Node.TEXT_NODE) || (child.content.length > 0)) {
            child.parent = this;
            this.children.push(child);
        }
    }

    render(parent, data) {

        this.context = new SafirTemplateContext(data);

        let processor;

        switch (this.type) {
            case Node.ELEMENT_NODE:
                if (this.prefix === SafirTemplate.prefix) {
                    // Find a template tag processor
                    let _class = SafirTemplateProcessor.getTag(this.name);
                    if (_class !== undefined) {
                        processor = new _class();
                    }
                } else {
                    processor = new SafirHtmlTagProcessor();
                }
                processor.process(this, parent);
                break;

            case Node.TEXT_NODE:
                processor = new SafirTextElementProcessor();
                processor.process(this, parent);
                break;

            case Node.CDATA_SECTION_NODE:
                // @TODO Implement CDATA processing
                break;
            default:
                processor = new SafirHtmlTagProcessor();
                processor.process(this, parent);
                break;
        }
    }

    clone() {
        let node = new SafirTemplateNode(this.parent);
        node.name = this.name;
        node.prefix = this.prefix;
        node.type = this.type;

        // Deep clone all children
        this.children.forEach(child => {
            node.addChild(child.clone());
        });

        node.content = this.content;

        this.tmpl_attributes.forEach((value, key) => {
            node.tmpl_attributes.set(key, value);
        });
        this.html_attributes.forEach((value, key) => {
            node.html_attributes.set(key, value);
        });
        node.context = new SafirTemplateContext(this.context.data);
        return node;
    }

    get(name) {
        if(name === '*') {
            return this.context.data;
        }

        let data = this.context.get(name);
        if (data === undefined) {
            if (this.parent === undefined) {
                console.log('this.parent', name);
            }
            data = this.parent.get(name);
        }
        return data;
    }

    data() {
        let _data = {};

        if(this.parent !== undefined) {
            _data = this.parent.data();
        }
        for(let name in this.context.data) {
            _data[name] = this.context.data[name];
        }
        return _data;
    }
}
/**
 *
 */
class SafirTemplateParser {

    /**
     *
     */
    constructor() {
        this.children = [];

    }

    /**
     *
     * @param selector
     */
    parse(selector) {
        let element = null;
        if (selector instanceof Element) {
            element = selector;
        } else {
            element = document.querySelector(selector);
        }


        let node = new LTemplateNode();
        let nodes = element.content.childNodes;
        this.parseChildNodes(node, nodes);
        // console.log(node);
        return node;
    }

    /**
     *
     * @param parent
     * @param children
     */
    parseChildNodes(parent, children) {
        let parser = this;
        children.forEach(function (dom, index) {
            let node = new LTemplateNode(parent);
            parser.parseNode(parent, node, dom);
        });
    }

    /**
     *
     * @param parent
     * @param node
     * @param dom_node
     */
    parseNode(parent, node, dom) {
        node.type = dom.nodeType;
        switch (node.type) {
            case Node.ELEMENT_NODE:
                this.parseTagName(node, dom.localName);
                for (let j = 0; j < dom.attributes.length; j++) {
                    this.parseAttributes(dom.attributes[j], node);
                }
                this.parseChildNodes(node, dom.childNodes);
                parent.addChild(node);
                break;
            case Node.TEXT_NODE:
                let text = dom.textContent.trim();
                if (text.length > 0) {
                    node.content = text;
                    parent.addChild(node);
                }
                break;
            case Node.CDATA_SECTION_NODE:
                console.log(dom);
                node.content = dom.nodeValue;
                parent.addChild(node);
                break;
        }
    }

    /**
     *
     * @param node
     * @param name
     */
    parseTagName(node, name) {
        const names = name.split(':');
        if (names.length > 1) {
            node.name = names[1];
            node.prefix = names[0];
        } else {
            node.name = names[0];
            node.prefix = false;
        }
    }

    /**
     *
     * @param attr
     * @param node
     */
    parseAttributes(attr, node) {
        const names = attr.localName.split(':');
        if (names.length > 1) {
            node.tmpl_attributes.set(names[1], attr.value);
        } else {
            node.html_attributes.set(names[0], attr.value);
        }
    }
}
class SafirTemplateProcessor {

    /**
     *
     * @type {{}}
     * @private
     */
    static _tag_registry = {};

    /**
     *
     * @type {{}}
     * @private
     */
    static _attr_registry = {};

    static getAttr(name) {
        if (SafirTemplateProcessor._attr_registry.hasOwnProperty(name)) {
            return SafirTemplateProcessor._attr_registry[name];
        } else {
            // console.warn('No processor found for attribute: ' + name);
            return undefined;
        }
    }

    static registerAttr() {
        for (let i = 0; i < arguments.length; i++) {
            let processor = arguments[i];
            let name = processor._name;
            if (name !== undefined) {
                if (!SafirTemplateProcessor._attr_registry.hasOwnProperty(name)) {
                    SafirTemplateProcessor._attr_registry[name] = processor;
                } else {
                    console.log('Processor for attribute [' + LTemplate.prefix + ':' + name + '] already registered. Ignoring current request.');
                }
            } else {
                console.error('Attribute processor must set static _name value');
            }
        }
    }

    static getTag(name) {
        if (SafirTemplateProcessor._tag_registry.hasOwnProperty(name)) {
            return SafirTemplateProcessor._tag_registry[name];
        } else {
            console.error('No processor found for tag: ' + name);
            return undefined;
        }
    }

    static registerTag() {

        for (let i = 0; i < arguments.length; i++) {
            let processor = arguments[i];
            let name = processor._name;
            if (name !== undefined) {
                if (!SafirTemplateProcessor._tag_registry.hasOwnProperty(name)) {
                    SafirTemplateProcessor._tag_registry[name] = processor;
                } else {
                    console.log('Processor for tag [' + SafirTemplate.prefix + ':' + name + '] already registered. Ignoring current request.');
                }
            } else {
                console.error('Tag processor must set static _name value');
            }
        }
    }
}

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
    static namespace = 'https://github.com/liviathan/lemurjs';

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

        window[SafirTemplate.prefix].init(target);
    }
}
class SafirBaseProcessor {

    /**
     *
     * @param value
     * @returns {*}
     */
    evalString(value, node) {
        const regex = /{{([^}]+)}}/g;
        let original_value = value;
        let matches = value.match(regex);
        if (matches && matches.length > 0) {
            for (let i = 0; i < matches.length; i++) {
                let match = matches[i];
                let key = match.substring(2, match.length - 2).trim();
                let context_value = node.get(key);
                value = value.replace(match, context_value);
            }
        }
        return (value !== undefined) ? value : original_value;
    }
}

class SafirConditionalProcessor extends SafirBaseProcessor {
    process_if(node, target, parent_processor, value, test) {
        if (value === test) {
            if (parent_processor !== undefined) {
                parent_processor.process(node, target);
            } else {
                let dom = new DocumentFragment();
                node.children.forEach(element => {
                    element.render(dom);
                });
                target.appendChild(dom);
            }
        }
    }
}



class SafirDataAttributeProcessor extends SafirBaseProcessor {
    static _name = 'attach-data';

    process(node, target, parent_processor) {
        node.append_data = true;
        parent_processor.process(node, target);
    }
}
/**
 * HTML Tag processors
 */
class SafirHtmlTagProcessor extends SafirBaseProcessor {
    process(node, parent, parent_processor) {
        let processors = [];

        for (let [name, value] of node.tmpl_attributes) {
            let processor = SafirTemplateProcessor.getAttr(name);
            if (processor !== undefined) {
                node.tmpl_attributes.delete(name);
                processors.push(processor);
            }
        }

        if (processors.length === 0) {
            let dom;
            if (node.name) {
                dom = document.createElement(node.name);
            } else {
                dom = new DocumentFragment();
            }

            // @TODO render attributes
            let attr_processor = new SafirAttributeProcessor();
            attr_processor.process(node, dom);

            for (let i = 0; i < node.children.length; i++) {
                node.children[i].render(dom);
            }

            // Append custom data

            if(node.append_data) {
                let _data = node.data();
                let data_registry = new SafirDomDataRegistry();
                data_registry.set(dom, _data);
            }

            parent.appendChild(dom);
        } else {
            if (parent_processor === undefined) {
                parent_processor = this;
            }

            processors.forEach(processor => {
                let instance = Reflect.construct(processor, []);
                instance.process(node, parent, parent_processor);
            });
        }
    }
}

class SafirAttributeProcessor extends SafirBaseProcessor {
    process(node, target, parent_processor) {
        for (let [name, value] of node.html_attributes) {
            let attr_value = this.evalString(value, node);
            target.setAttribute(name, attr_value);
        }
        for (let [name, value] of node.tmpl_attributes) {
            let attr_value = this.evalString(value, node);
            target.setAttribute(SafirTemplate.prefix + ':' + name, attr_value);
        }
    }
}

class SafirIfBaseProcessor extends SafirConditionalProcessor {

    static _tag_attribute_name = 'test';

    getHtmlCondition(node, name) {
        let attr = node.html_attributes.get(name);
        return node.get(attr);
    }

    getNanoCondition(node, name) {
        let attr = node.tmpl_attributes.get(name);
        return node.get(attr);
    }
}


class SafirIfTagProcessor extends SafirIfBaseProcessor {
    static _name = 'if';

    process(node, target, parent_processor) {
        let cond = this.getHtmlCondition(node, SafirIfBaseProcessor._tag_attribute_name);
        this.process_if(node, target, parent_processor, cond, true);
    }
}

class SafirIfNotTagProcessor extends SafirIfBaseProcessor {
    static _name = 'if-not';

    process(node, target, parent_processor) {
        let cond = this.getHtmlCondition(node, SafirIfBaseProcessor._tag_attribute_name);
        this.process_if(node, target, parent_processor, cond, false);
    }
}

class SafirIfAttributeProcessor extends SafirIfBaseProcessor {
    static _name = 'if';

    process(node, target, parent_processor) {
        let cond = this.getNanoCondition(node, SafirIfAttributeProcessor._name);
        node.tmpl_attributes.delete(SafirIfAttributeProcessor._name);
        this.process_if(node, target, parent_processor, cond, true);
    }
}

class SafirIfNotAttributeProcessor extends SafirIfBaseProcessor {
    static _name = 'if-not';

    process(node, target, parent_processor) {
        let cond = this.getNanoCondition(node, SafirIfNotAttributeProcessor._name);
        node.tmpl_attributes.delete(SafirIfNotAttributeProcessor._name);
        this.process_if(node, target, parent_processor, cond, false);
    }
}
class SafirLoopBaseProcessor {

    getCurrentItem(data, index, variable) {
        let _data = {};
        _data['_index_'] = index;
        _data[variable] = data[index];
        return _data;
    }
}

class SafirLoopAttributeProcessor extends SafirLoopBaseProcessor {

    static _name = 'loop';

    process(node, target, parent_processor) {
        let attr = node.tmpl_attributes.get('loop');
        let data = node.get(attr);
        let variable = node.tmpl_attributes.get('as');

        // node.tmpl_attributes.clear();

        node.tmpl_attributes.delete('loop');
        node.tmpl_attributes.delete('as');
        for (let index in data) {
            let _data = this.getCurrentItem(data, index, variable);
            node.clone().render(target, _data);
        }
    }
}

class SafirLoopTagProcessor extends SafirLoopBaseProcessor {

    static _name = 'loop';

    process(node, target, parent_processor) {
        let attr = node.html_attributes.get('on');
        let data = node.get(attr);
        let variable = node.html_attributes.get('as');

        // node.tmpl_attributes.clear();

        for (let index in data) {
            let _data = this.getCurrentItem(data, index, variable);
            for (let j = 0; j < node.children.length; j++) {
                let child = node.children[j];
                child.clone().render(target, _data);
            }
        }
    }
}
window.addEventListener('DOMContentLoaded', (event) => {
    /**
     * Attribute processors
     */
    SafirTemplateProcessor.registerAttr(
        SafirTextAttributeProcessor // text
        , SafirTextEscapedAttributeProcessor // text-escaped
        , SafirIfAttributeProcessor // if
        , SafirIfNotAttributeProcessor // if-not
        , SafirLoopAttributeProcessor // loop
        , SafirDataAttributeProcessor // attach-data
    );

    /**
     * Tag Processors
     */
    SafirTemplateProcessor.registerTag(
        SafirIfTagProcessor // if
        , SafirIfNotTagProcessor // if-not
        , SafirLoopTagProcessor // loop
    );
});
class SafirTextProcessor extends SafirBaseProcessor {
    stringToNode(content) {
        let tpl = document.createElement('template');
        tpl.innerHTML = content;
        return tpl.content;
    }

    escapeHtmlString(text) {
        let escape = document.createElement('textarea');
        escape.textContent = text;
        return escape.innerHTML;
    }
}

class SafirTextElementProcessor extends SafirTextProcessor {
    process(node, target, parent_processor) {
        let child = document.createTextNode(this.evalString(node.content, node))
        target.appendChild(child);
    }
}

class SafirTextAttributeProcessor extends SafirTextProcessor {

    static _name = 'text';

    process(node, target, parent_processor) {
        let attr = node.tmpl_attributes.get('text');
        if (attr !== undefined) {
            let content = node.get(attr);
            node.tmpl_attributes.delete('text');
            if (content !== undefined) {
                let child = new LTemplateNode(node);
                child.type = Node.TEXT_NODE;
                child.content = content;
                node.addChild(child);
                parent_processor.process(node, target);
            }
        }
    }
}

class SafirTextEscapedAttributeProcessor extends SafirTextProcessor {

    static _name = 'text-escaped';

    process(node, target, parent_processor) {
        let attr = node.tmpl_attributes.get('text-escaped');
        if (attr !== undefined) {
            let content = node.get(attr);
            node.tmpl_attributes.delete('text-escaped');
            if (content !== undefined) {
                content = this.escapeHtmlString(content);
                let child = new SafirTemplateNode(node);
                child.content = content;
                child.type = Node.TEXT_NODE;
                node.addChild(child);
                parent_processor.process(node, target);
            }
        }
    }
}
class SafirObject {

    prototypes = undefined;

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
        if (constructor.name !== 'LObject') {
            if (constructor.prototype) {
                let tmp = this._getPrototypes(constructor.prototype);
                prototypes = prototypes.concat(tmp);
            }
        }
        return prototypes;
    }

}

class SafirListener extends SafirObject {

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
        return SafirOption.registry.hasOwnProperty(selector) ? LOption.registry[selector] : undefined;
    }

    static load(selector, options) {
        SafirOption.registry[selector] = options;
    }
}
class SafirHttpRequest {

    method = 'post';
    url = '';
    response_handlers = [];
    headers = {};

    /**
     *
     */
    constructor(options) {
        this.options = new SafirOption(options);
        options = this.options.getOptions();

        if(options.hasOwnProperty('response_handlers')) {
            for(const i in options.response_handlers) {
                let handler = options.response_handlers[i];
                this.registerResponseHandler(handler);
            }
        }
    }

    registerResponseHandler(handler) {
        this.response_handlers.push(Reflect.construct(handler, []));
    }

    /**
     *
     */
    prepare(method, url, headers) {
        this.method = method;
        this.url = url;
        // Prepare custom headers
        if (headers) {
            for (const header in headers) {
                this.headers[header] = headers[header];
            }
        }
    }

    /**
     *
     */
    send(data) {

        const method = this.method.toUpperCase();

        let url = this.url;
        if (method === 'GET' && data !== undefined) {
            let queryString = this.toQueryString(data);
            if (queryString) {
                url = url + '?' + queryString;
            }
        }

        if(!(data instanceof FormData)) {
            data = JSON.stringify(data);
        }

        const request = new Request(url, {method: method, body: data});

        for(const header in this.headers) {
            request.headers.append(header, this.headers[header]);
        }

        let l_request = this;
        let l_request_success = false;
        let l_request_status = 0;

        fetch(request)
            .then(response => {
                l_request_status = response.status;
                l_request_success = response.ok;
                return response.json();
            }).
        then(json_response => {
            if(l_request_success) {
                for (let i in l_request.response_handlers) {
                    let handler = l_request.response_handlers[i];
                    if (handler && handler.on_http_success) {
                        handler.on_http_success.call(handler, l_request_status, json_response);
                    }
                }
            } else {
                for (let i in l_request.response_handlers) {
                    let handler = l_request.response_handlers[i];
                    if (handler && handler.on_http_error) {
                        handler.on_http_error.call(handler, l_request_status, json_response);
                    }
                }
            }
        })
        .catch((error) => {
            for (let i in l_request.response_handlers) {
                let handler = l_request.response_handlers[i];
                if (handler && handler.on_network_error) {
                    handler.on_network_error.call(handler, data);
                }
            }
        });
    }

    toQueryString(data) {
        if (data instanceof SafirRequestData) {
            return data.toQueryString();
        } else if (data instanceof FormData) {
            let rdata = new LRequestData();
            for (let key of data.keys()) {
                rdata.append(key, data.get(key));
            }
            return rdata.toQueryString();
        } else {
            let rdata = new SafirRequestData();
            for (let key in data) {
                rdata.append(key, data[key]);
            }
            return rdata.toQueryString();
        }
    }
}

class SafirRequestData {

    data = {};
    attachments = {};

    constructor() {
    }

    append(name, value) {
        if (value instanceof File) {
            this._append(name, value, this.attachments);
        } else {
            this._append(name, value, this.data);
        }
    }

    _append(name, value, destination) {
        if (!destination.hasOwnProperty(name)) {
            destination[name] = value;
        } else {
            if (Array.isArray(destination[name])) {
                destination[name].push(value);
            } else {
                destination[name] = [destination[name], value];
            }
        }
    }

    set(name, value) {
        if (value instanceof File) {
            this.attachments[name] = value;
        } else {
            this.data[name] = value;
        }
    }

    toQueryString() {
        if (Object.keys(this.data).length > 0) {
            let components = [];
            for (let p in this.data) {
                if (this.data.hasOwnProperty(p)) {
                    components.push(this._fixURIComponent(p) + '=' + this._fixURIComponent(this.data[p]));
                }
            }
            return components.join("&");
        } else {
            return null;
        }
    }

    toFormData() {
        let fdata = new FormData();

        if (Object.keys(this.data).length > 0) {
            fdata.set('data', JSON.stringify(this.data));
        } else {
            fdata.set('data', null);
        }

        if (Object.keys(this.attachments).length > 0) {
            for (let p in this.attachments) {
                let attachment = this.attachments[p];
                if (Array.isArray(attachment)) {
                    for (let i = 0; i < attachment.length; i++) {
                        fdata.append(p, attachment[i]);
                    }
                } else {
                    fdata.set(p, attachment);
                }
            }
        }

        return fdata;
    }

    _fixURIComponent(str) {
        return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
            return '%' + c.charCodeAt(0).toString(16);
        });
    };
}
class SafirListenable {

    constructor(options) {
        this.options = new LOption(options);


    }

    registerListeners() {
        /**
         * Register listeners from options
         */

        let _options = this.options.getOptions();

        if (this.elt) {
            if (_options.hasOwnProperty('listeners')) {
                for (const i in _options.listeners) {
                    this.registerListener(_options.listeners[i]);
                }
            }
        }
    }

    registerListener(listener) {
        try {
            let instance = Reflect.construct(listener, [this.elt]);
            instance.target = this;
        } catch (e) {
            console.error(e);
            console.error('Listener MUST be a constructable');
        }
    }
}

class SafirView extends SafirListenable {
    constructor(selector, options) {
        super(options);

        if (selector instanceof Element) {
            this.elt = selector;
        } else {
            this.elt = document.querySelector(selector);
        }

        if (this.elt) {
            this._setupViewID();
            this.elt.setAttributeNS(LTemplate.namespace, 'view', '');

            this.registerListeners();
        } else {
            console.error('View element not found');
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

    getElement() {
        return this.elt;
    }
}

class SafirViewBuilder {

    static id_index = 0;

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

class SafirForm extends SafirView {

    constructor(selector, request) {
        super(selector);
        if (request !== undefined) {
            this.request = new request();
        } else {
            this.request = new SafirHttpRequest();
        }

        this.request.prepare(this.elt.method || 'post', this.elt.action);
        this.registerListener(SafirFormListener);
    }

    submit() {
        let data = new FormData(this.elt);
        this.request.send(data);
    }
}

class SafirFormListener extends SafirListener {
    on_submit(event) {
        event.preventDefault();
        this.target.submit();
    }
}


function SafirIdGenerator() {
    if( typeof SafirIdGenerator.counter == 'undefined' ) {
        SafirIdGenerator.counter = 0;
    }
    return '_' + LTemplate.prefix + '_generated_id_' + SafirIdGenerator.counter++;
}

class SafirDomDataRegistry {

    constructor() {
        if (!!SafirDomDataRegistry.instance) {
            return SafirDomDataRegistry.instance;
        }

        SafirDomDataRegistry.instance = this;
        this.registry = new Map();

        return this;
    }

    get(dom) {
        let id = dom.getAttribute('id');
        if(id !== null) {
            return this.registry.get(id);
        } else {
            return null;
        }
    }

    set(dom, value) {
        let id = dom.getAttribute('id');
        if(id == null) {
            id = LIdGenerator();
            dom.setAttribute('id', id);
        }
        this.registry.set(id, value);
    }

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
class LaravelRequest extends SafirHttpRequest {
    constructor(options) {
        super(options);
        let header = document.querySelector('meta[name="csrf-token"]');
        this.headers['Accept'] = 'application/json';
        if(header) {
            this.headers['X-CSRF-TOKEN'] = header.getAttribute('content');
        }

    }
}
// Init library prefix
let element = document.querySelector('html');

for (let name of element.getAttributeNames()) {
    let value = element.getAttribute(name);
    if (value === LTemplate.namespace) {
        const names = name.split(':');
        if (names.length > 1 && names[0] === 'xmlns') {
            LTemplate.prefix = names[1];
        }
    }
}

if (LTemplate.prefix === '') {
    console.warn('Template namespace not specified, using default: lm');
    LTemplate.prefix = 'lm';
}

// Create helper function
window[LTemplate.prefix] = {
    loaded : function(func, objects){
        LRegistry.functions.push(func);
        if(Array.isArray(objects)) {
            for (let i in objects) {
                LRegistry.add(objects);
            }
        }
    },
    attached_data : function(dom) {
        let data_registry = new LDomDataRegistry();
        return data_registry.get(dom);
    },
    init : function(parent) {

        let elements = parent.querySelectorAll('[' + LTemplate.prefix + '\\:listener]');

        elements.forEach(function (elt) {
            let attr = elt.getAttribute(LTemplate.prefix + ':listener');
            let listener = LRegistry.get(attr);
            if (listener !== null) {
                Reflect.construct(listener, [elt]);
            }
        });

        let forms = parent.querySelectorAll('form');

        forms.forEach(function (elt) {

            let attr = elt.attributes.getNamedItem(LTemplate.prefix + ':response-handler');
            if (attr) {
                let form = new LForm(elt);
                let handlers = attr.value.split(',');
                for(let i = 0; i < handlers.length; i++) {
                    let handler = LRegistry.get(handlers[i]);
                    if (handler !== null) {
                        form.request.registerResponseHandler(handler);
                    }
                }
            }
        });

        // Init forms

        let editable = parent.querySelectorAll('.form-editable');
        editable.forEach(function (element, index) {
            Reflect.construct(LFormEditableHelper, [element]);
        });
    }
};


class LRegistry {

    static registry = new Map();

    static functions = new Array();

    static add() {
        for (let i = 0; i < arguments.length; i++) {
            let arg = arguments[i];
            if (arg.hasOwnProperty('name')) {
                LRegistry.registry.set(arg.name, arg);
            } else {
                console.log('no name', arg);
            }
        }
    }

    static get(name) {
        if (LRegistry.registry.has(name)) {
            return LRegistry.registry.get(name);
        } else {
            return null;
        }
    }
}

window.addEventListener('DOMContentLoaded', (event) => {

    for (let i in LRegistry.functions) {
        LRegistry.functions[i].call();
    }

    // Init all listeners
    window[LTemplate.prefix].init(document);

});

setInterval(function(){
    let data_registry = new LDomDataRegistry();
    data_registry.clean();
}, 5000);