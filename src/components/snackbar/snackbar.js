// @flow
import * as React from 'react';
import {connect} from 'react-redux';
import {IconButton, Snackbar, SnackbarContent} from '@material-ui/core';
import ErrorIcon from '@material-ui/icons/Error';
import CloseIcon from '@material-ui/icons/Close';
import {setMessage} from './actions';
import styles from './snackbar.module.css';

interface Props {
    message: string,
    handlerClose: () => void
}
function SnackBar(props: Props) {
    return (
        <Snackbar open={!!props.message} onClose={props.handlerClose} autoHideDuration={5000}>
            <SnackbarContent
                className={styles[props.type]}
                message={(
                    <span id="client-snackbar" className={styles['snack-message']}>
                        <ErrorIcon className={styles['snack-message__icon']} />
                        {props.message}
                    </span>
                )}
                action={[
                    <IconButton key="close" aria-label="close" color="inherit" onClick={props.handlerClose}>
                        <CloseIcon className={styles['snack-message__icon']} />
                    </IconButton>,
                ]}
            />
        </Snackbar>
    )
}

export default connect(
    ({snackbar: state}, {type}) => ({
        message: state[type]
    }),
    (dispatch,  {type}) => ({
        handlerClose: () => dispatch(setMessage(null, type))
    })
)(SnackBar);
