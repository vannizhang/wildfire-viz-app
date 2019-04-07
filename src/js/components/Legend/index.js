import React from 'react';

import { numberFns } from 'helper-toolkit';

class Legend extends React.Component {

    constructor(props){
        super(props);
    };

    render(){

        const legendItems = [];

        for(let i = 4; i >= 0; i--){

            const label = this.props.data[i] && this.props.data[i].classMaxValue ? numberFns.abbreviateNumber(this.props.data[i].classMaxValue) : '';
            
            const legendItem =  (           
                <div key={`legend-item-${i}`} className="block filter-wrap text-center font-size--3">
                    <div className={`legend-icon legend-class-${i}`}></div>
                    <div className="filter-label">{label}</div>
                </div>
            );

            legendItems.push(legendItem);
        }

        return(
            <div id='legendDiv'>
                <div className="block-group block-group-5-up leader-half legend-filter-container">
                    {legendItems}
                </div>
            </div>
        );
    };

};

export default Legend;