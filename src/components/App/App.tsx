import * as React from 'react';

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
                    <span className='font-size--3'>Active US wildfires by affected area (in square miles)</span>
                    <span className='js-modal-toggle margin-left-half font-size-0 cursor-pointer right' data-modal="about">
                        
                        <svg xmlns="http://www.w3.org/2000/svg" height={16} width={16} viewBox="0 0 16 16"><path fill='currentColor' d="M8.5 6.5a1 1 0 1 1 1-1 1.002 1.002 0 0 1-1 1zM8 13h1V8H8zm2-1H7v1h3zm5.8-3.5a7.3 7.3 0 1 1-7.3-7.3 7.3 7.3 0 0 1 7.3 7.3zm-1 0a6.3 6.3 0 1 0-6.3 6.3 6.307 6.307 0 0 0 6.3-6.3z"/><path fill="none" d="M0 0h16v16H0z"/></svg>
                    </span>
                </div>

                <Legend />

                {/* <SmokeLayerToggle /> */}

                <ListModeToggle />

                <ListView />
                
            </Sidebar>

            <AboutThisApp />
        </>
    );
};

export default App;