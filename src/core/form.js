class SafirForm extends SafirView {
    constructor(selector, request) {
        super(selector);
        if (request !== undefined) {
            this.request = Reflect.construct(request, []);
        } else {
            this.request = new SafirHttpRequest();
        }

        this.request.prepare(this.elt.method || 'post', this.elt.action);
        this.registerListener(SafirFormListener);
    }

    submit() {
        let data = new FormData(this.elt);
        this.request.send(data);
    }
}

class SafirFormListener extends SafirEventListener {
    on_submit(event) {
        event.preventDefault();
        this.target.submit();
    }
}

/**
 * Simple
 */
class SafirRedirectHandler {
    on_http_success(status, json) {
        if(json.next) {
            window.location.href = json.next;
        }
    }
}