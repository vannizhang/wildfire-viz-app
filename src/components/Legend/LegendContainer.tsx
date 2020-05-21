import * as React from 'react';
import { useSelector  } from 'react-redux';
import Legend from './Legend';

import {
    wildfireLayerRendererSelector
} from '../../store/reducers/map';

const LegendConatiner:React.FC= ()=>{

    const renderer = useSelector(wildfireLayerRendererSelector);

    const getMaxValues = ()=>{
        if(!renderer){
            return [];
        }

        return renderer.classBreakInfos.map(d=>{
            return d.classMaxValue
        });
    }

    return (
        <Legend 
            maxValues={getMaxValues()}
        />
    );
};

export default LegendConatiner;