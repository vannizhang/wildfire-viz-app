import './style.scss';

import React from 'react';

import config from '../../core/config';

const PCT_CONTAINED_FIELD_NAME = config.fields.pct_contained;
const FIELD_NAME_AREA = config.fields.area
const FIELD_NAME_INTERNAL_ID = config.fields.internal_id;

class GridList extends React.Component {

    constructor(props){
        super(props);

    };

    render(){

        const data = JSON.parse(JSON.stringify(this.props.data)) || [];

        data.sort((a,b)=>{
            return b.attributes[FIELD_NAME_AREA] - a.attributes[FIELD_NAME_AREA];
        });

        const gridItems = data.map((d, i)=>{

            const pctContained = d.attributes[PCT_CONTAINED_FIELD_NAME];
            const legendClass = d.classBreak;
            const fireID = d.attributes[FIELD_NAME_INTERNAL_ID];

            return (
                <div key={`grid-item-${i}`} className="js-show-info-window block trailer-half js-zoom-to-fire" data-fire-id={fireID}>
                    <div className={`legend-icon legend-class-${legendClass}`}>
                        <div className='bottom-pct-indicator'>
                            <div className='highlight-bar' style={{width: `${pctContained}%`}}></div>
                        </div>
                    </div>
                </div>

            );
        });

        return(
            <div id='gridListDiv'>
                <div className='legend-grid block-group block-group-6-up'>
                    {gridItems}
                </div>
            </div>
        )

    };

};

export default GridList;