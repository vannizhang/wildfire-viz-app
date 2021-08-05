import * as React from 'react';
import { useSelector  } from 'react-redux';
import Legend from './Legend';

// import {
//     wildfireLayerRendererSelector
// } from '../../store/reducers/map';

const Labels = ['<10','50','100','250', '650+']

const LegendConatiner:React.FC= ()=>{

    // const renderer = useSelector(wildfireLayerRendererSelector);

    // const getMaxValues = ()=>{
    //     if(!renderer){
    //         return [];
    //     }

    //     return Labels.map((d,i)=>{
    //         return d.classMaxValue
    //     });
    // }

    return (
        <Legend 
            labels={Labels}
        />
    );
};

export default LegendConatiner;