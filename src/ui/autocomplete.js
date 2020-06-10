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