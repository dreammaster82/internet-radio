import {waitOnline} from './online-check';

class Queue {
    #maxPending;
    #cursor = 0;
    #queue = [];

    constructor(length = 5) {
        this.#maxPending = length;
    }

    allSettled(promises){
        return Promise.allSettled(promises.map(p => this.addQueue(p)));
    }

    addQueue(item) {
        return new Promise((resolve, reject) => {
            this.#queue.push({item, resolve, reject});

            this.#next();
        });
    }

    #next() {
        if (this.#cursor < this.#maxPending) {
            this.#cursor++;

            if (this.#queue.length) {
                let {item, resolve, reject} = this.#queue.shift();

                let pr;
                if (typeof item == 'function') {
                    pr = item();
                }

                if (!(pr instanceof Promise)) {
                    pr = Promise.resolve(pr);
                }

                pr
                    .then(data => resolve(data))
                    .catch(err => reject(err))
                    .finally(() => {
                        this.#cursor--;
                        this.#next();
                    });
            } else {
                this.#cursor = 0;
            }
        }
    }
}

const queue = new Queue();

const stoppedError = ['File not found', 'Chunk out of range'];
function oneChunkLoad(id, part, signal){
    return new Promise(r => setTimeout(() => r(), Math.random() * 1500)).then(waitOnline).then(() => {
        return fetch(`/api/split/get/${id}/${part}`, {signal})
            .then(res => {
                if (res.ok) return res.blob();
                else return res.text().then(t => {
                    if (stoppedError.includes(t)) throw Error(t);
                    else return oneChunkLoad(id, part, signal);
                });
            })
            .catch(err => {
                if (stoppedError.includes(err && err.message ? err.message : err)) throw Error(err);
                else return oneChunkLoad(id, part, signal);
            })
    });
}

function loadChunks(id, stop) {
    let promises = [];
    let controllers = [];
    let chunks = [];
    for (let part = 0;part < 66; part++) {
        let controller = new AbortController();
        let signal = controller.signal;
        controllers.push(controller);
        promises.push(() => {
            return oneChunkLoad(id, part, signal)
                .then(chunk => {
                    chunks.push({part, chunk});
                });
        });
    }
    // eslint-disable-next-line no-unused-vars
    stop = () => {
        controllers.forEach(controller => {
            controller.abort();
        });
    }
    return queue.allSettled(promises).then(() => chunks);
}

function loader(item) {
    let stop = () => null;
    const pr = new Promise((r, rj) => {
        let inStop = () => null;
        loadChunks(item.id, inStop)
            .then(chunks => r(new Blob(chunks.sort((a, b) => a.part - b.part).map(i => i.chunk))))
            .catch(e => rj(e));

        stop = () => {
            inStop();
            rj('stop');
        };
    });
    pr.stop = stop;

    return pr;
}

class CacheStorage {
    #store = new Map();
    #list = []
    static maxCacheLength = 15;

    startCache(item) {
        if (item?.id && !this.#store.has(item.id)) {
            let deleteId;
            if (this.#list.length == CacheStorage.maxCacheLength) {
                deleteId = this.#list.shift();
                this.deleteCache(this.#store.get(deleteId));
            }

            const promise = loader(item)
                .then(file => {
                    this.#store.set(item.id, {url: URL.createObjectURL(file)});
                })
                .catch(err => console.error(err));
            this.#store.set(item.id, {promise});
            this.#list.push(item.id);
            return promise.then(() => deleteId);
        } else return Promise.reject();
    }

    deleteCache(item) {
        if (item?.id && this.#store.has(item.id)) {
            const it = this.#store.get(item.id);
            if (it.promise) it.promise.stop();
            this.#store.delete(item.id);
        }
    }

    getItem(item) {
        if (item && item.id) {
            const it = this.#store.get(item.id);
            if (it?.url) return it.url;
        }
        return null;
    }
}

export default new CacheStorage();
