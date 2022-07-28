export const SET_MESSAGE = 'SET_MESSAGE';

export function setMessage(message, type) {
    return {
        type: SET_MESSAGE,
        message: {message, type}
    };
}