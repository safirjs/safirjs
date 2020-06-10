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
        }
    }
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