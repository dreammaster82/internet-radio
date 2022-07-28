import {SET_MESSAGE} from './actions';

const initState = {};

export default (state = initState, action) => {
    switch (action.type) {
        case SET_MESSAGE:
            return {...state, ...{[action.message.type]: action.message.message}};
        default:
            return state;
    };
};
