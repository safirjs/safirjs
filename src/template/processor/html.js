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
