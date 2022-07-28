(global => {
    global.ready = new Promise(r => {
        if (document.readyState == 'loading') {
            document.addEventListener('DOMContentLoaded', () => r());
        } else {
            r();
        }
    });

    global.ready.then(() => {
        let main = document.querySelector('main');
        main.innerHTML = '';
        main.className = 'loading';
    })
})(self || global || window);
