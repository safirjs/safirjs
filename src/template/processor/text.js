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