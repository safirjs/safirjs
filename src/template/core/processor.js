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
