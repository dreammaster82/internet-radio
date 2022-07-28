// @flow
import * as React from 'react';
import {RefObject, PureComponent, createRef} from 'react';
import {connect} from 'react-redux';
import {Fab, Input} from '@material-ui/core';
import {ArrowUpward as UploadIcon, Shuffle} from '@material-ui/icons';
import type {Sound} from '../main/main';
import {debounce} from '../../utils';
import {setFind, shuffleItems} from '../main/actions';
import cacheStorage from '../../cache-storage';
import {subscribe} from '../../online-check';
import styles from './header.module.css';

interface Props {
    handlerFindChange: (e: KeyboardEvent) => void,
    audioRef: RefObject,
    onUpload: (e: UIEvent) => void,
    item: Sound
};

interface State {
    find: string
};

class Header extends PureComponent<State, Props> {
    state = {
        find: ''
    };
    uploadRef = React.createRef();

    setFind = debounce(find => this.props.handlerFindChange(find));

    componentDidMount() {
        if (this.uploadRef.current) {
            this.uploadRef.current.addEventListener('change', this.props.onUpload);
        }

        if (this.logoRef.current) {
            this.subscription = subscribe(type => {
                if (type == 'offline') {
                    this.logoRef.current.style.opacity = .7;
                } else this.logoRef.current.style.opacity = 1;
            })
        }
    }

    componentWillUnmount(): * {
        this.subscription.unsubscribe();
    }

    handlerUpload = () => {
        if (this.uploadRef.current) {
            this.uploadRef.current.click();
        }
    };

    handlerFindChange = (e: UIEvent) => {
        this.setState({find: e.target.value});
        this.setFind(e.target.value);
    };

    logoRef = createRef();
    subscription = null;

    render() {
        let src;

        if (this.props.item) {
            let item = cacheStorage.getItem(this.props.item);
            if (item) {
                src = item;
            } else {
                src = '/api/play/' + this.props.item.id;
            }
        }

        return (
            <header>
                <div className="top">
                    <div className="logo" ref={this.logoRef}>
                        <img src="/logo.png" />
                        <h1 className="head">Мир</h1>
                    </div>
                    <div>
                        <Input
                            placeholder="Поиск"
                            onChange={this.handlerFindChange}
                            value={this.props.find}
                            classes={{root: styles['find-input'], focused: styles['focused']}}
                            fullWidth
                        />
                    </div>
                    <div className={styles['shuffle']}>
                        <Fab className={styles['shuffle-button']} onClick={this.props.shuffleItems} title="Случайная сортировка">
                            <Shuffle></Shuffle>
                        </Fab>
                    </div>
                </div>
                <div className={styles['bottom']}>
                    <div className={styles['controls']}>
                        <audio ref={this.props.audioRef} src={src} disabled={!this.props.item} autoPlay controls />
                    </div>
                    <div className={styles['upload-block']}>
                        <Fab className={styles['big-upload']} onClick={this.handlerUpload} variant="extended" title="Загрузить музыку">
                            <UploadIcon></UploadIcon>
                            Добавить
                        </Fab>
                        <Fab className={styles['small-upload']} onClick={this.handlerUpload} title="Загрузить музыку">
                            <UploadIcon></UploadIcon>
                        </Fab>
                        <input type="file" ref={this.uploadRef} className="hidden" />
                    </div>
                </div>
            </header>
        );
    }
}

export default connect(
    ({main: state}) => ({
        item: state.item
    }),
    {
        handlerFindChange: setFind,
        shuffleItems
    }
)(Header);
