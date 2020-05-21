import * as React from 'react';
import { useDispatch, useSelector  } from 'react-redux';
import { allFeaturesSelector, updateWildfireFeature2FlyTo } from '../../store/reducers/wildfires';

import {
    searchTermChanged
} from '../../store/reducers/UI';

import Search from './Search';

const SearchContainer:React.FC = ()=>{

    const dispatch = useDispatch();

    const allFeatures = useSelector(allFeaturesSelector);

    return( 
        <Search 
            data={allFeatures}
            onChange={(val)=>{
                dispatch(searchTermChanged(val))
            }}
        />
    );
};

export default SearchContainer;
