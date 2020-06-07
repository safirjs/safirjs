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