import './styles/index.scss';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import store from './store/configureStore';
import { App } from './components';

import { setDefaultOptions } from 'esri-loader';
setDefaultOptions({ version: '4.27' });

const root = createRoot(document.getElementById('root'));

root.render(
    <Provider store={store}>
        <App />
    </Provider>
);