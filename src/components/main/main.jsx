// @flow
import * as React from 'react';
import {useMemo, useEffect} from 'react';
import {connect} from 'react-redux';
import {IconButton, List, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText} from '@material-ui/core';
import DownloadIcon from '@material-ui/icons/ArrowDownward';
import PlayIcon from '@material-ui/icons/PlayArrow';
import {setItem} from './actions';
import styles from './main.module.css';

export interface Sound {
    id: string,
    name: string,
    meta: {
        title?: string,
        artist?: string
    },
    weight: number,
    fakeName?: string,
    cached?: boolean
};

interface Props {
    items: Array<Sound>,
    find: string,
    handlerPlay: Sound => void,
    handlerDownload: Sound => void,
    item: Sound
};

function filterItems(items, find) {
    return find ? items.filter(it => new RegExp(find, 'ig').test(it.fakeName)) : items;
};

function isElementInViewport(el) {
    if (el.style.display === 'none') return false
    var rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

function Main(props: Props) {
    let items = useMemo(() => filterItems(props.items, props.find), [props.items, props.find]);

    useEffect(() => {
        if (props.item) {
            document.title = props.item.fakeName;
            let activeEl = document.querySelector(`.${styles['list-content']} .active`);
            if (activeEl && !isElementInViewport(activeEl)){
                activeEl.scrollIntoView();
            }
        } else document.title = 'Мир';

        return () => {
            document.title = 'Мир';
        };
    }, [props.item]);

    return (
        <section className={styles['list-content']}>
            {items && <List dense className={styles['list']}>
                {items.map(it => (
                    <ListItem key={it.id} button classes={{
                        button: styles['list-button'],
                        container: props.item && props.item.id === it.id ? 'active' : null
                    }} onClick={() => props.handlerPlay(it)} divider>
                        <ListItemIcon className="icon"><PlayIcon /></ListItemIcon>
                        <ListItemText className={it.cached ? styles['cached'] : null}>{it.fakeName}</ListItemText>
                        <ListItemSecondaryAction>
                            <IconButton onClick={() => props.handlerDownload(it)} className="icon"><DownloadIcon /></IconButton>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>}
        </section>
    )
};

export default connect(
    ({main: state}) => ({
        items: state.items,
        find: state.find,
        item: state.item
    }),
    (dispatch, props) => ({
        handlerPlay: item => {
            dispatch(setItem(item));
            props.handlerPlay && props.handlerPlay(item);
        }
    })
)(Main);
