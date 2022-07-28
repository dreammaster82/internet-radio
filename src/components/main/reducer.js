import {SET_FIND, SET_ITEM, UPDATE_ITEMS, CACHE_ITEM, CACHE_REMOVE} from './actions';

const initState = {
    items: [],
    find: '',
    item: null
};

export default (state = initState, action) => {
    switch (action.type) {
        case UPDATE_ITEMS:
            return {...state, items: action.items};
        case SET_FIND:
            return {...state, find: action.find};
        case SET_ITEM:
            return {...state, item: action.item};
        case CACHE_ITEM:
            const items = state.items;
            const index = items.indexOf(action.item);
            if (index != -1) {
                items[index] = {...action.item, cached: true};
            }
            return {...state, items: [...items]};
        case CACHE_REMOVE:
            const indexItem = state.items.findIndex(it => it.id === action.itemId);
            const item = state.items[indexItem];
            item.cached = false;
            state.items[indexItem] = {...item};
            return {...state, items: [...state.items]};
        default:
            return state;
    };
};
