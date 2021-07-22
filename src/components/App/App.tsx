import * as React from 'react';

import {
    ListMode
} from '../../store/reducers/UI';

import { 
    MapView, 
    Sidebar,
    ListModeToggle,
    ListView,
    Legend,
    Search,
    AboutThisApp,
    SmokeLayerToggle
} from '../';

const App:React.FC = ()=>{

    return (
        <>
            <MapView />

            <Sidebar>
                
                <Search />

                <div className='leader-half trailer-0'>
                    <span className='font-size--3'>Active US wildfires by affected area (in acres)</span>
                    <span className='js-modal-toggle icon-ui-description margin-left-half font-size-0 cursor-pointer right' data-modal="about"></span>
                </div>

                <Legend />

                <SmokeLayerToggle />

                <ListModeToggle />

                <ListView />
                
            </Sidebar>

            <AboutThisApp />
        </>
    );
};

export default App;