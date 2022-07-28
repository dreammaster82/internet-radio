export const SET_FIND = 'SET_FIND';
export const SET_ITEM = 'SET_ITEM';
export const UPDATE_ITEMS = 'UPDATE_ITEMS';
export const CACHE_ITEM = 'CACHE_ITEM';
export const CACHE_REMOVE = 'CACHE_REMOVE';

export function addItems(items) {
    return (dispatch, getState) => dispatch(updateItems([...getState().main.items, ...items]));
};

export function shuffleItems() {
    return (dispatch, getState) => dispatch(updateItems([...getState().main.items].sort(() => {
        return Math.round(Math.random()) ? 1 : -1;
    })));
}

export function updateItems(items) {
    return {
        type: UPDATE_ITEMS,
        items
    };
};

export function setFind(find) {
    return {
        type: SET_FIND,
        find
    };
};

export function setItem(item) {
    return {
        type: SET_ITEM,
        item
    };
};

export function cacheItem(item) {
    return {
        type: CACHE_ITEM,
        item
    };
};

export function cacheRemove(itemId) {
    return {
        type: CACHE_REMOVE,
        itemId
    };
}
