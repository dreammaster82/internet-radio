import * as React from 'react';
import styles from './loader.module.css';

export default function Loader({loading, children, className = null} = {}) {
    return (
        <div className={styles['loader'] + (loading ? ' loading' : '')}>
            <div style={{display: loading ? 'none' : ''}} className={className}>{children}</div>
        </div>
    );
}