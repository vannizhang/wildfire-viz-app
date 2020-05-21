import { combineReducers } from 'redux';

import wildfiresReducer from './wildfires';
import mapReducer from './map';
import UIReducer from './UI';

export default combineReducers({
    wildfires: wildfiresReducer,
    map: mapReducer,
    ui: UIReducer
});