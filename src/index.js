import './style/index.scss';

import "@babel/polyfill";
import React from 'react';
import ReactDOM from 'react-dom';

import DataStore from './js/core/DataStore';

import App from './js/components/App/index';

(async function initApp(){

    try {
        const dataStore = new DataStore();

        const appData = await dataStore.init();

        ReactDOM.render(
            <App 
                dataStore={dataStore}
                activeFires={appData.activeFires}
                classBreakInfos={appData.classBreakInfos}
            />, 
            document.getElementById('appRootDiv')
        );
        
    } catch(err){
        console.error(err);
    }


    
})();



