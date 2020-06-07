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