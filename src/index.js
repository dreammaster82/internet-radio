import * as React from 'react';
import ReactDOM from 'react-dom';
import {createStore, applyMiddleware} from 'redux';
import {Provider} from 'react-redux'
import thunk from 'redux-thunk';
import reducer from './reducer';
import App from './app';
import {init} from './online-check';
import {register} from './service-worker-register';

register({swName: 'sw.js'})
    .then(() => console.log('service worker registered'))
    .catch(e => console.log('service worker register error', e));

window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
});

const store = createStore(reducer, applyMiddleware(thunk));
init();

ready.then(() => {
    ReactDOM.render(<Provider store={store}><App /></Provider>, document.getElementById('root'));
})
