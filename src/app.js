// @flow
import * as React from 'react';
import {Component, Fragment} from 'react';
import {connect} from 'react-redux';
import Main from './components/main';
import Header from './components/header';
import Snackbar from './components/snackbar';
import type {Sound} from './components/main';
import {addItems, setItem, cacheItem, cacheRemove} from './components/main/actions';
import {setMessage} from './components/snackbar/actions';
import Loader from './components/loader';
import cacheStorage from './cache-storage';

interface State {
    loading: boolean
};

interface Props {
    addItems: (Array<Sound>) => void,
    setErrorMessage: string => void,
    items: Array<Sound>,
    item: Sound
}

function setMediaMeta(item) {
    if (item && navigator.mediaSession) {
        const {title, album, artist} = item;
        navigator.mediaSession.metadata = new MediaMetadata({title, album, artist});
    }
}

class App extends Component<Props, State> {
    state = {
        loading: false
    };

    audioRef = React.createRef();

    getItems = () => {
        this.setState({loading: true});
        fetch('/api/items').then(res => {
            if (res.ok) return res.json();
            else return res.text().then(t => {
                throw new Error(t);
            });
        }).then((items: Array<Sound>) => {
            if (items && items.length){
                items = items.map(it => {
                    return {
                        ...it,
                        fakeName: it.meta.title || it.meta.artist ? it.meta.artist + ' - ' + it.meta.title : it.name
                    };
                });
                this.props.addItems(items);
            }
        }).catch(e => {
            this.props.setErrorMessage(e.message);
        }).finally(() => this.setState({loading: false}));
    }

    timer: number = 0;

    getItem = (type = 'next', loop = false) => {
        let curIndex = this.props.items.findIndex(it => it.id === this.props.item.id);

        if (curIndex == -1) return;

        switch (type) {
            case 'next':
                curIndex++;
                if (curIndex >= this.props.items.length) {
                    if (loop) curIndex = 0;
                    else curIndex = -1;
                }
                break;
            case 'prev':
                curIndex--;
                if (curIndex < 0) {
                    if (loop) curIndex = this.props.items.length - 1;
                    else curIndex = -1;
                }
                break;
            default:
                curIndex = -1;
        }

        if (curIndex != -1) return this.props.items[curIndex];
    }

    setItem = (type: string, loop = false) => {
        if (!type) return;

        const item = this.getItem(type, loop);
        if (item) {
            this.props.setItem(item);
            setMediaMeta(item);
        }
    }

    componentDidMount() {
        this.getItems();

        if (this.audioRef.current) {
            this.audioRef.current.addEventListener('ended', () => {
                if (this.timer) {
                    let duration = Math.ceil((Date.now() - this.timer) / 1000);
                    this.timer = 0;
                    let audioDuration = this.audioRef.current.duration;
                    if (audioDuration && isFinite(audioDuration)) {
                        if (duration / audioDuration > .8) this.updateWeight(this.props.item.id);
                    }
                }

                this.setItem('next');
            });

            this.audioRef.current.addEventListener('canplaythrough', () => {
                this.startCaching(this.props.item);
            });
        }

        if (navigator.mediaSession) {
            navigator.mediaSession.setActionHandler('nexttrack', () => {
                this.setItem('next', true);
            });
            navigator.mediaSession.setActionHandler('previoustrack', () => {
                this.setItem('prev', true);
            });
        }
    }

    startCaching(item) {
        let curIndex = this.props.items.indexOf(item);
        if (curIndex !== -1) {
            const timeout = item.cached ? 0 : 30000
            setTimeout(() => {
                this.startCache(curIndex + 1);
                this.startCache(curIndex + 2);
            }, timeout);
        }

    }

    startCache = index => {
        const item = this.props.items[index];
        if (item) cacheStorage.startCache(item).then(deletedItem => {
            this.props.cacheItem(item);
            if (deletedItem) this.props.cacheRemove(deletedItem);
        });
    }

    updateWeight(id) {
        fetch('/api/update-weight/' + id, {method: 'POST', body: JSON.stringify({weight: 0.3}), headers: {'Content-Type': 'application/json'}, credentials: 'include'}).then(res => {
            if (res.ok) return res.text();
            else return res.text().then(t => {
                throw new Error(t);
            });
        }).catch(e => {
            this.props.setErrorMessage(e.message);
        });
    }

    uploadFile = e => {
        let target = e.target;
        if (target.files && target.files[0] && target.files[0].size && target.files[0].type == 'audio/mp3') {
            let file = target.files[0];
            let form = new FormData();
            form.append('file', file);
            fetch('/api/upload', {method: 'PUT', body: form, credentials: 'include'}).then(res => {
                if (res.ok) return res.text();
                else return res.text().then(t => {
                    throw new Error(t);
                });
            }).then(() => {
                return this.getItems();
            }).catch(e => {
                this.props.setErrorMessage(e.message);
            });
        }
    }

    handlerDownload = (item) => {
        let link = document.createElement('a');
        link.target = '_blank';
        link.href = '/api/download/' + item.id;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        link.remove();
    }

    handlerPlay = (item) => {
        this.timer = Date.now();
        this.startCaching(item);

        setMediaMeta(item);
    }

    render() {
        return (
            <Fragment>
                <Header onUpload={this.uploadFile} audioRef={this.audioRef} />
                <Loader loading={this.state.loading}>
                    <Main handlerDownload={this.handlerDownload} handlerPlay={this.handlerPlay} />
                </Loader>
                <Snackbar type="error" />
            </Fragment>
        );
    }
}

export default connect(
    ({main: state}) => ({
        items: state.items,
        item: state.item
    }),
    dispatch => ({
        addItems: items => dispatch(addItems(items)),
        setErrorMessage: message => dispatch(setMessage(message, 'error')),
        setItem: item => dispatch(setItem(item)),
        cacheItem: item => dispatch(cacheItem(item)),
        cacheRemove: itemId => dispatch(cacheRemove(itemId))
    })
)(App);
