import * as React from 'react';
import { useDispatch, useSelector  } from 'react-redux';
import ListModeToggle from './ListModeToggle';

import {
    visibleFeaturesSelector
} from '../../store/reducers/wildfires';

import {
    listModeSelector,
    listModeChanged
} from '../../store/reducers/UI';

const ListModeToggleContainer:React.FC = ()=>{

    const dispatch = useDispatch();

    const visibleFeatures = useSelector(visibleFeaturesSelector);

    const activeListMode = useSelector(listModeSelector);

    return(
        <ListModeToggle
            countOfFires={visibleFeatures.length}
            activeListMode={activeListMode}
            onChange={(val)=>{
                dispatch(listModeChanged(val));
            }}
        />
    );
};

export default ListModeToggleContainer;