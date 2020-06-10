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
        this.context = new SafirTemplateContext();
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
                console.error('this.parent', name);
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


        let node = new SafirTemplateNode();
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
            let node = new SafirTemplateNode(parent);
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
                    console.log('Processor for attribute [' + SafirTemplate.prefix + ':' + name + '] already registered. Ignoring current request.');
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


/**
 *
 */
class SafirDataAttributeProcessor extends SafirBaseProcessor {
    static _name = 'attach-data';

    process(node, target, parent_processor) {
        // Delete this to prevent infinite loop
        node.tmpl_attributes.delete(SafirDataAttributeProcessor._name);
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
                // node.tmpl_attributes.delete(name);
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

            let attr_processor = new SafirAttributeProcessor();
            attr_processor.process(node, dom);

            for (let i = 0; i < node.children.length; i++) {
                node.children[i].render(dom);
            }

            // Append custom data
            if(node.append_data) {
                let _data = node.data();
                Object.defineProperty(dom, 'attached_data', {
                    value: _data,
                    writable: false
                });
            }

            parent.appendChild(dom);
        } else {
            if (parent_processor === undefined) {
                parent_processor = this;
            }

            processors.forEach(processor => {
                let instance = Reflect.construct(processor, []);
                instance.process(node, parent, parent_processor);
                // Once processing is done, the attribute must be deleted to prevent infinite loop
                node.tmpl_attributes.delete(processor._name);
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

/**
 * Base class for IF-* processors. provide some helper function.
 */
class SafirIfBaseProcessor extends SafirConditionalProcessor {

    static _tag_attribute_name = 'test';

    getHtmlCondition(node, name) {
        let attr = node.html_attributes.get(name);
        return node.get(attr);
    }

    getTmplCondition(node, name) {
        let attr = node.tmpl_attributes.get(name);
        return node.get(attr);
    }
}

/**
 * IF tag processor
 * @example
 * <sf:if test="show"> ... text ... </sf:if>
 * The text will be displayed if *show* is evaluated to true
 */
class SafirIfTagProcessor extends SafirIfBaseProcessor {
    static _name = 'if';
    process(node, target, parent_processor) {
        let cond = this.getHtmlCondition(node, SafirIfBaseProcessor._tag_attribute_name);
        this.process_if(node, target, parent_processor, cond, true);
    }
}

/**
 * IF-NOT tag processor
 * @example
 * <sf:if-not test="show"> ... text ... </sf:if-not>
 * The text will be displayed if *show* is evaluated to false
 */
class SafirIfNotTagProcessor extends SafirIfBaseProcessor {
    static _name = 'if-not';
    process(node, target, parent_processor) {
        let cond = this.getHtmlCondition(node, SafirIfBaseProcessor._tag_attribute_name);
        this.process_if(node, target, parent_processor, cond, false);
    }
}

// @TODO create an sf:else processor

/**
 * IF attribute processor
 * @example
 * <p sf:if="show"> ... text ... </p>
 * The element <p> and it's children will be displayed if *show* is evaluated to true
 */
class SafirIfAttributeProcessor extends SafirIfBaseProcessor {
    static _name = 'if';
    process(node, target, parent_processor) {
        let cond = this.getTmplCondition(node, SafirIfAttributeProcessor._name);
        node.tmpl_attributes.delete(SafirIfAttributeProcessor._name);
        this.process_if(node, target, parent_processor, cond, true);
    }
}

/**
 * IF-NOT attribute processor
 * @example
 * <p sf:if-not="show"> ... text ... </p>
 * The element <p> and it's children will be displayed if *show* is evaluated to false
 */
class SafirIfNotAttributeProcessor extends SafirIfBaseProcessor {
    static _name = 'if-not';
    process(node, target, parent_processor) {
        let cond = this.getTmplCondition(node, SafirIfNotAttributeProcessor._name);
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
                let child = new SafirTemplateNode(node);
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
/**
 * Generate unique ID
 * @returns {string}
 * @constructor
 */
function SafirIdGenerator() {
    if(typeof SafirIdGenerator.counter == 'undefined') {
        SafirIdGenerator.counter = 0;
    }
    let number = SafirIdGenerator.counter++;
    let prefix = Math.random().toString(36).slice(-5);
    number = number.toString(36).padStart(5, '0');
    return SafirTemplate.prefix + '_' + prefix + number;
}

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
        this.id = SafirIdGenerator();
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
        try {
            this.response_handlers.push(Reflect.construct(handler, []));
        }
        catch (e) {
            this.response_handlers.push(handler);
        }
    }

    clearHandlers() {
        this.response_handlers = [];
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
        let request_option = {method: method};
        if(method === 'GET' || method === 'HEAD') {
            if(data !== undefined) {
                let queryString = this.toQueryString(data);
                if (queryString) {
                    url = url + '?' + queryString;
                }
            }
        } else {
            if(!(data instanceof FormData)) {
                data = JSON.stringify(data);
            }
            request_option['body'] = data;
        }

        const request = new Request(url, request_option);

        for(const header in this.headers) {
            request.headers.append(header, this.headers[header]);
        }

        let l_request = this;
        let fetch_response = null;

        for (let i in l_request.response_handlers) {
            let handler = l_request.response_handlers[i];
            if (handler && handler.on_http_sent) {
                handler.on_http_sent.call(handler);
            }
        }

        fetch(request)
            .then(response => {
                fetch_response = response;
                return response.json();
            }).
        then(json_response => {
            if(fetch_response.ok) {
                for (let i in l_request.response_handlers) {
                    let handler = l_request.response_handlers[i];
                    if (handler && handler.on_http_success) {
                        handler.on_http_success.call(handler, fetch_response.status, json_response, fetch_response);
                    }
                }
            } else {
                for (let i in l_request.response_handlers) {
                    let handler = l_request.response_handlers[i];
                    if (handler && handler.on_http_error) {
                        handler.on_http_error.call(handler, fetch_response.status, json_response, fetch_response);
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
            let request_data = new SafirRequestData();
            for (let key of data.keys()) {
                request_data.append(key, data.get(key));
            }
            return request_data.toQueryString();
        } else {
            let request_data = new SafirRequestData();
            for (let key in data) {
                request_data.append(key, data[key]);
            }
            return request_data.toQueryString();
        }
    }
}

class SafirSecureHttpRequest extends SafirHttpRequest {
    constructor(options) {
        super(options);
        this.headers['Accept'] = 'application/json';
        let token_name = document.querySelector('meta[name="secure-token-name"]');
        let token_value = document.querySelector('meta[name="secure-token"]');

        if(token_value) {
            let value = token_value.getAttribute('content');
            if(token_name) {
                let name = token_name.getAttribute('content');
                this.headers[name] = value;
            } else {
                this.headers['X-CSRF-TOKEN'] = value;
            }
        } else {
            console.warn('[secure-token] META not found in page header');
        }
    }
}

class SafirHttpHandler {

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
        let form_data = new FormData();

        if (Object.keys(this.data).length > 0) {
            form_data.set('data', JSON.stringify(this.data));
        } else {
            form_data.set('data', null);
        }

        if (Object.keys(this.attachments).length > 0) {
            for (let p in this.attachments) {
                let attachment = this.attachments[p];
                if (Array.isArray(attachment)) {
                    for (let i = 0; i < attachment.length; i++) {
                        form_data.append(p, attachment[i]);
                    }
                } else {
                    form_data.set(p, attachment);
                }
            }
        }

        return form_data;
    }

    _fixURIComponent(str) {
        return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
            return '%' + c.charCodeAt(0).toString(16);
        });
    };
}
/**
 * Handle element than can be targeted by events
 * @class SafirEventTarget
 * @author liva Ramarolahy
 */

class SafirEventTarget extends SafirObject {

    /**
     *
     * @type {Map<string, SafirEventTarget>}
     */
    static registry = new Map();

    constructor(selector) {
        super();

        this.event_listeners = new Map();

        if (selector instanceof Element) {
            this.elt = selector;
        } else {
            this.elt = document.querySelector(selector);
        }

        if (this.elt instanceof Element) {
            this.setupId();
            if (SafirEventTarget.registry.has(this.elt.id)) {
                return SafirEventTarget.registry.get(this.elt.id);
            } else {
                SafirEventTarget.registry.set(this.elt.id, this);
            }
        } else {
            console.error('SafirEventTarget', 'Element with selector [' + selector + '] not found');
        }
    }

    /**
     * Generate a new ID if missing
     */
    setupId() {
        if (this.elt.hasAttribute('id')) {
            let elt_id = this.elt.getAttribute('id');
            if (elt_id.trim() !== '') {
                this.id = elt_id;
            } else {
                this.elt.setAttribute('id', this.id);
            }
        } else {
            this.elt.setAttribute('id', this.id);
        }
    }

    /**
     * Add an event listener to the current target. This method ensure that each type of listener is added only once
     * by maintaining the list of listeners in the instance.
     * @param listener
     */
    addEventListener(listener) {
        try {
            listener = Reflect.construct(listener, [this.elt]);
        } catch (e) {
            console.error(e);
        }

        if (listener instanceof SafirEventListener) {
            let constructor = listener.constructor.name;
            if (!this.event_listeners.has(constructor)) {
                listener.target = this.elt;
                listener.apply(this.elt);
                this.event_listeners.set(constructor, listener);
            }
        } else {
            console.error(listener.constructor.name + ' IS NOT an instance of SafirEventListener');
            console.log(listener);
        }
    }
}

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

class SafirForm extends SafirElement {
    constructor(selector, request) {
        super(selector);
        if (request !== undefined) {
            this.request = Reflect.construct(request, []);
        } else {
            this.request = new SafirHttpRequest();
        }

        this.request.prepare(this.elt.method || 'post', this.elt.action);
        this.addEventListener(SafirFormListener);
    }

    submit() {
        let data = new FormData(this.elt);
        this.request.send(data);
    }
}

class SafirSecureForm extends SafirForm {
    constructor(selector) {
        super(selector, SafirSecureHttpRequest);
    }
}

class SafirFormListener extends SafirEventListener {
    on_submit(event) {
        event.preventDefault();
        this.target.submit();
    }
}

/**
 * Simple
 */
class SafirRedirectHandler {
    on_http_success(status, json) {
        if(json.next) {
            window.location.href = json.next;
        }
    }
}
//
//
// /**
//  * Storage for HTMLElement custom data
//  */
// class SafirDomDataRegistry {
//
//     /**
//      *
//      * @returns {SafirDomDataRegistry}
//      */
//     constructor() {
//         if (!!SafirDomDataRegistry.instance) {
//             return SafirDomDataRegistry.instance;
//         }
//
//         SafirDomDataRegistry.instance = this;
//         this.registry = new Map();
//
//         return this;
//     }
//
//     /**
//      * Get a custom data associated with dom param if any
//      * @param dom HTMLElement
//      * @returns {null|Object}
//      */
//     get(dom) {
//         let id = dom.getAttribute('id');
//         if(id !== null) {
//             return this.registry.get(id);
//         } else {
//             return null;
//         }
//     }
//
//     /**
//      * Set associate a custom data to an HTMLElement.
//      * This function will set an ID to the if it doesn't have one yet.
//      * @param dom HTMLElement
//      * @param value
//      */
//     set(dom, value) {
//         let id = dom.getAttribute('id');
//         if(id == null) {
//             id = SafirIdGenerator();
//             dom.setAttribute('id', id);
//         }
//         this.registry.set(id, value);
//     }
//
//     /**
//      * Preserve browser memory by deleting orphaned data
//      */
//     clean() {
//         let orphan_data = [];
//         for(let [name, _] of this.registry) {
//             let elt = document.getElementById(name);
//             if(elt === null) {
//                 orphan_data.push(name);
//             }
//         }
//         if(orphan_data.length > 0) {
//             for(let i = 0; i < orphan_data.length; ++i) {
//                 this.registry.delete(orphan_data[i]);
//             }
//         }
//     }
// }
class BootstrapEditableFormHelper extends SafirElement {
    constructor(selector, options) {
        super(selector, options);
        this.addToggleListener();
        this.addEditableListener();
    }

    addEditableListener() {
        let elements = this.elt.querySelectorAll('.form-control-editable');
        if (elements.length > 0) {
            let form = this;
            elements.forEach(function (element, index) {
                element.addEventListener('click', form.showEditable.bind(form));
            });
        }
    }

    addToggleListener() {
        let trigger = this.elt.querySelector('.form-editable-toggle');
        trigger.addEventListener('click', this.onToggleClick.bind(this));
    }

    onToggleClick() {
        this.showEditable();
    }

    showEditable() {
        let elements = this.elt.querySelectorAll('.form-control-editable');
        this.showEditableFormControls(elements);

        let editable = this.elt.querySelectorAll('.form-edit-only');
        if (editable.length > 0) {
            editable.forEach(function (element, index) {
                element.classList.remove('form-edit-only');
            });
        }

        let display = this.elt.querySelectorAll('.form-display-only');
        if (display.length > 0) {
            display.forEach(function (element, index) {
                element.classList.add('d-none');
            });
        }
    }

    showEditableFormControls(elements) {
        if (elements.length > 0) {
            elements.forEach(function (element, index) {
                element.classList.remove('form-control-plaintext');
                element.classList.add('form-control');
                element.readOnly = false;
            });
        }
    }
}
class SafirFileUploader {
    constructor(options) {

        this.target = document.getElementById(options.target);
        this.preview = document.getElementById(options.preview);
        this.template = document.getElementById(options.template);
        this.max_size = options.max_size || (1024 * 1024);
        this.max_count = options.max_count || 10;
        this.addTargetEventListener();
    }

    addTargetEventListener()
    {
        if(this.target) {
            this.target.addEventListener('change', this.loadPreview.bind(this));
        }
    }

    loadPreview()
    {
        let files = this.target.files;

        let template = new SafirTemplate(this.template);

        if(files.length > 0) {

            for (let i = 0; i < files.length && i < this.max_count; i++) {

                const file = files[i];

                // if (!file.type.startsWith('image/')){
                //     continue;
                // }

                let data = {index : i};

                if(file.size > this.max_size) {
                    data.valid_size = false;
                } else {
                    data.valid_size = true;
                }

                const reader = new FileReader();
                reader.onload = (function(_template, _preview, _data) { return function(e) {
                    _data.file_data = e.target.result;
                    _template.render(_preview, _data);

                }; })(template, this.preview, data);

                reader.readAsDataURL(file);
            }
        }
    }
}
/**
 *
 */
class SafirUIAutocomplete extends SafirObject {
    constructor(options) {
        super();
        this.target = options.target;
        this.template = options.template;
        this.url = options.url;
        this.request = options.request ? Reflect.construct(options.request, [])
            : Reflect.construct(SafirHttpRequest, []);
        this.request.registerResponseHandler(this);
        this.request.prepare('get', this.url);
        this.data_queue = [];
        this.request_pending = false;
        this.initSuggestionContainer();
        this.target.setAttribute('autocomplete', 'off');
    }

    /**
     *
     * @param data
     */
    query(data) {
        this.data_queue.push(data);
        if (this.request_pending === false) {
            this._send_query();
        }
    }

    /**
     * @TODO move container class ['autocomplete-items'] to options
     */
    initSuggestionContainer() {
        let tmp_container = this.target.nextElementSibling;
        if (!tmp_container.classList.contains('autocomplete-items')) {
            // Bad container, should create a new one
            let good_container = document.createElement('div');
            good_container.classList.add('autocomplete-items');
            this.container = good_container;
            this.target.parentElement.insertBefore(this.container, tmp_container);
        } else {
            this.container = tmp_container;
        }
    }

    _send_query() {
        let data = this.data_queue[0];
        this.request.send(data);
    }

    on_http_sent() {
        this.request_pending = true;
        this.data_queue.shift();
    }

    on_http_success(status, json, response) {
        this.clearSuggestions();
        let template = new SafirTemplate(this.template);
        template.render(this.container, json);
        this.request_pending = false;

        this.addItemEventListeners(json.terms);

        // Get last data
        let data = this.data_queue.pop();
        if (data !== undefined) {
            this.data_queue = [data];
            this._send_query();
        }
    }

    on_http_error(status, json, response) {

    }

    addItemEventListeners(terms) {
        let items = this.container.querySelectorAll('.item');
        for (let i = 0; i < items.length; ++i) {
            let item = items[i];
            let term = terms[i];
            let event = new Event('select');
            event.data = term;
            item.addEventListener('click', () => {
                item.dispatchEvent(event);
            });
            item.addEventListener('select', this.onItemSelect.bind(this));
        }
    }

    clearSuggestions() {
        // Remove previous terms
        while (this.container.firstChild) {
            this.container.removeChild(this.container.lastChild);
        }
    }

    onItemSelect(event) {
        this.target.value = event.data.value;
        this.clearSuggestions();
    }

    on_network_error(data) {

    }
}
// Init library prefix
let element = document.querySelector('html');

for (let name of element.getAttributeNames()) {
    let value = element.getAttribute(name);
    if (value === SafirTemplate.namespace) {
        const names = name.split(':');
        if (names.length > 1 && names[0] === 'xmlns') {
            SafirTemplate.prefix = names[1];
        }
    }
}

if (SafirTemplate.prefix === '') {
    console.warn('Template namespace not specified, using default: sf');
    SafirTemplate.prefix = 'sf';
}

// Create helper function
const safir = {
    loaded: function (func, objects) {
        SafirRegistry.functions.push(func);
        if (Array.isArray(objects)) {
            for (let i in objects) {
                SafirRegistry.add(objects);
            }
        }
    },
    // attached_data: function (dom) {
    //     let data_registry = new SafirDomDataRegistry();
    //     return data_registry.get(dom);
    // },
    init: function (parent) {

        let elements = parent.querySelectorAll('[' + SafirTemplate.prefix + '\\:listener]');

        elements.forEach(function (elt) {
            let attr_name = SafirTemplate.prefix + ':listener';
            let attr = elt.getAttribute(attr_name);
            let listener = SafirRegistry.get(attr);
            if (listener !== null) {
                let target = new SafirEventTarget(elt);
                target.addEventListener(listener);
                elt.removeAttribute(attr_name);

            } else {
                console.error('%cListener [' + attr + '] not found. %cPlease add: %cSafirRegistry.add(' + attr + '); %cin your code'
                    , 'color:red;', 'color:black;', 'color:blue; font-weight:bold;', 'color:black;');
            }
        });

        let forms = parent.querySelectorAll('form');

        forms.forEach(function (elt) {

            let form = null;
            /**
             * Check if custom form class was provided
             * @type {Attr}
             */
            let is_attr = elt.attributes.getNamedItem(SafirTemplate.prefix + ':is');
            if (is_attr) {
                let _class = SafirRegistry.get(is_attr.value);
                if (_class !== null) {
                    form = Reflect.construct(_class, [elt]);
                }
            }
            if (form === null) {
                form = new SafirSecureForm(elt);
            }

            let attr = elt.attributes.getNamedItem(SafirTemplate.prefix + ':response-handler');
            if (attr) {
                let handlers = attr.value.split(',');
                for (let i = 0; i < handlers.length; i++) {
                    let handler = SafirRegistry.get(handlers[i]);
                    if (handler !== null) {
                        form.request.registerResponseHandler(handler);
                    } else {
                        console.error('Handler not found', handlers[i]);
                    }
                }
                // Finally add some default handler
                form.request.registerResponseHandler(SafirRedirectHandler);
            }
        });

        // Init forms
        // @TODO Third-party initialization should be moved out of this script.

        let editable = parent.querySelectorAll('.form-editable');
        editable.forEach(function (element, index) {
            Reflect.construct(BootstrapEditableFormHelper, [element]);
        });
    },
    register() {
        for (let i = 0; i < arguments.length; i++) {
            let arg = arguments[i];
            if(arg instanceof SafirHttpHandler) {
                console.log(arg);
            } else if (arg instanceof SafirEventListener) {
                console.log(arg);
            }
        }
    }
};


class SafirRegistry {

    static event_targets = new Map();

    static registry = new Map();

    static functions = new Array();

    static listeners = new Map();

    static handlers = new Map();

    static add() {
        for (let i = 0; i < arguments.length; i++) {
            let arg = arguments[i];
            if (arg.hasOwnProperty('name')) {
                SafirRegistry.registry.set(arg.name, arg);
            } else {
                console.log('no name', arg);
            }
        }
    }

    static get(name) {
        if (SafirRegistry.registry.has(name)) {
            return SafirRegistry.registry.get(name);
        } else {
            return null;
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

    for (let i in SafirRegistry.functions) {
        SafirRegistry.functions[i].call();
    }

    // Init all listeners
    safir.init(document);

});

// setInterval(function () {
//     let data_registry = new SafirDomDataRegistry();
//     data_registry.clean();
// }, 5e3);