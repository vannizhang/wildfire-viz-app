import { 
    configureStore, 
    // getDefaultMiddleware 
    DeepPartial,
} from '@reduxjs/toolkit';

import rootReducer from './reducers/root';

export type RootState = ReturnType<typeof rootReducer>;

export type PartialRootState = DeepPartial<RootState>;

const configureAppStore = (preloadedState: PartialRootState = {}) => {
    const store = configureStore({
        reducer: rootReducer,
        // middleware: [...getDefaultMiddleware<RootState>()],
        preloadedState: preloadedState as any,
    });

    return store;
};

export type AppStore = ReturnType<typeof configureAppStore>;

export type StoreDispatch = ReturnType<typeof configureAppStore>['dispatch'];

export type StoreGetState = ReturnType<typeof configureAppStore>['getState'];

export default configureAppStore;