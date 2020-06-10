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