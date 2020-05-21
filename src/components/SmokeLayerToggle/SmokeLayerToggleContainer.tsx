import * as React from 'react';

import { useDispatch, useSelector  } from 'react-redux';
import {
    smokeLayerVisibleToggled,
    smokeLayerVisibleSelector,
    smokeLayerCurrentTimeExtentSelector
} from  '../../store/reducers/map';

import SmokeLayerToggle from './SmokeLayerToggle';

const SmokeLayerToggleContainer:React.FC = ()=>{

    const dispatch = useDispatch();

    const isVisible = useSelector(smokeLayerVisibleSelector);

    const smokeLayerCurrentTimeExtent = useSelector(smokeLayerCurrentTimeExtentSelector);

    return (
        <SmokeLayerToggle 
            currentTime={smokeLayerCurrentTimeExtent?.[0]}
            isVisible={isVisible}
            onClick={()=>{
                dispatch(smokeLayerVisibleToggled());
            }}
        />
    )
};

export default SmokeLayerToggleContainer;