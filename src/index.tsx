import './styles/index.scss';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import store from './store/configureStore';
import { App } from './components';

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>, 
    document.getElementById('root')
);