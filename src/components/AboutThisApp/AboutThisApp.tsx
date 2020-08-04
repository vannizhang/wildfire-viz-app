import * as React from 'react';
import styled from 'styled-components';
import { modal } from 'calcite-web/dist/js/calcite-web.min.js';

import {
    UIConfig
} from '../../AppConfig';

const AboutModal = styled.div`

    .modal-content{
        background-color: ${UIConfig.ThemeColorDarkPurple};
        color: ${UIConfig.ThemeColorYellow};
    }

    .btn, a {
        color: rgb(242, 203, 131);
    }
`;

const AboutThisApp:React.FC = ()=>{

    React.useEffect(()=>{
        modal();
    }, []);

    return (
        <AboutModal className="js-modal modal-overlay" data-modal="about">
            <div className="modal-content column-12" role="dialog" aria-labelledby="modal">
            
                <span className="js-modal-toggle right cursor-pointer" aria-label="close-modal">
                    <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 32 32" className="svg-icon"><path d="M18.404 16l9.9 9.9-2.404 2.404-9.9-9.9-9.9 9.9L3.696 25.9l9.9-9.9-9.9-9.898L6.1 3.698l9.9 9.899 9.9-9.9 2.404 2.406-9.9 9.898z"/></svg>
                </span>
            
                <h3 className='trailer-half avenir-demi'>About this app</h3>

                <p>This map presents active wildfires in the United States. Fires are sorted by burn size (in the grid view) or age (in the timeline view).</p>

                <p>The fires source is the Integrated Reporting of Wildland-Fire Information (IRWIN) location database along with the polygon perimeters from the National Interagency Fire Center (NIFC). Both layers update every 15 minutes.</p>

                <p>Smoke forecasts are disseminated by the National Weather Service and show a 48-hour forecast window in 1-hour increments. More information about this service can be found <a href='https://www.arcgis.com/home/item.html?id=a98fd08751a5480c898b7cebe38807f4' target='_blank'>here</a>.</p>

                <p>When zoomed-in, additional fire points will appear. These are NOAA/NASA satellite-detected locations of recent “thermal activity” that can provide an indication of fire direction. Learn more about this data <a href='https://www.arcgis.com/home/item.html?id=dece90af1a0242dcbf0ca36d30276aa3' target='_blank'>here</a>.</p>

                <p>This application is an unofficial presentation of this data and is intended for reference only. It was designed by Esri’s <a href='https://github.com/vannizhang' target='_blank'>Jinnan Zhang</a> and <a href='https://adventuresinmapping.com/' target='_blank'>John Nelson</a>, using Firefly symbology available in <a href='https://www.esri.com/arcgis-blog/products/arcgis-living-atlas/mapping/whats-new-in-arcgis-online-firefly/' target='_blank'>ArcGIS Online</a> and <a href='https://www.esri.com/arcgis-blog/products/arcgis-pro/mapping/steal-this-firefly-style-please/' target='_blank'>ArcGIS Pro</a>, and the <a href='https://livingatlas.arcgis.com/en/browse/#d=1&q=%22World%20Imagery%20(Firefly)%22' target='_blank'>Firefly basemap</a>.</p>

                <div className="text-right">
                    <button className="btn btn-transparent js-modal-toggle">Close</button>
                </div>
            </div>
        </AboutModal>
    )
};

export default AboutThisApp;