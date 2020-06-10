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
        SafirRegistry.initializers.push(func);
        if (Array.isArray(objects)) {
            for (let i in objects) {
                SafirRegistry.add(objects);
            }
        }
    },
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

/**
 * @TODO find a way to remove this class
 */
class SafirRegistry {

    static registry = new Map();

    static initializers = new Array();

    static listeners = new Map();

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

    for (let i in SafirRegistry.initializers) {
        SafirRegistry.initializers[i].call();
    }

    // Init all listeners
    safir.init(document);

});