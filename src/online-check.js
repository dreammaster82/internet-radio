let promise = setOnlinePromise();
let resolver = () => null;
const subscribers = new Set();
function setOnlinePromise() {
    if (window.navigator.onLine) return Promise.resolve();

    return new Promise(r => {
        resolver = r;
    });
}

export function init() {
    window.addEventListener('online', () => {
        resolver();
        subscribers.forEach(it => it('online'));
    });

    window.addEventListener('offline', () => {
        promise = setOnlinePromise();
        subscribers.forEach(it => it('offline'));
    });
}

export function subscribe(subscriber) {
    const subscription = (type) => subscriber(type);
    subscription.unsubscribe = () => subscribers.delete(subscription);
    subscribers.add(subscription);
    return subscription
}

export function waitOnline() {
    return promise;
}
