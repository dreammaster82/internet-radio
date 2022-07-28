import {combineReducers} from 'redux';
import snackbarReducer from './components/snackbar/reducer';
import mainReducer from './components/main/reducer';

export default combineReducers({main: mainReducer, snackbar: snackbarReducer});
