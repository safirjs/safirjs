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
    loaded : function(func, objects){
        SafirRegistry.functions.push(func);
        if(Array.isArray(objects)) {
            for (let i in objects) {
                SafirRegistry.add(objects);
            }
        }
    },
    attached_data : function(dom) {
        let data_registry = new SafirDomDataRegistry();
        return data_registry.get(dom);
    },
    init : function(parent) {

        let elements = parent.querySelectorAll('[' + SafirTemplate.prefix + '\\:listener]');

        elements.forEach(function (elt) {
            let attr = elt.getAttribute(SafirTemplate.prefix + ':listener');
            let listener = SafirRegistry.get(attr);
            if (listener !== null) {
                Reflect.construct(listener, [elt]);
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
            if(is_attr) {
                let _class = SafirRegistry.get(is_attr.value);
                if(_class !== null) {
                    form = Reflect.construct(_class, [elt]);
                }
            }
            if(form === null) {
                form = new SafirForm(elt);
            }

            let attr = elt.attributes.getNamedItem(SafirTemplate.prefix + ':response-handler');
            if (attr) {
                let handlers = attr.value.split(',');
                for(let i = 0; i < handlers.length; i++) {
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

        let editable = parent.querySelectorAll('.form-editable');
        editable.forEach(function (element, index) {
            Reflect.construct(BootstrapEditableFormHelper, [element]);
        });
    }
};


class SafirRegistry {

    static registry = new Map();

    static functions = new Array();

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

    SafirRegistry.add(LaravelForm);

    for (let i in SafirRegistry.functions) {
        SafirRegistry.functions[i].call();
    }

    // Init all listeners
    safir.init(document);

});

setInterval(function(){
    let data_registry = new SafirDomDataRegistry();
    data_registry.clean();
}, 5e3);