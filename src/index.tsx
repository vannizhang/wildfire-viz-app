import './styles/index.scss';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import store from './store/configureStore';
import { App } from './components';

import { setDefaultOptions } from 'esri-loader';

setDefaultOptions({ version: '4.18' });

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>, 
    document.getElementById('root')
);