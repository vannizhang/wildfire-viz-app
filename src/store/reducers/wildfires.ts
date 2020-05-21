import { 
    createSlice,
    createSelector
} from '@reduxjs/toolkit';

import {
    RootState,
    StoreDispatch,
    StoreGetState
} from '../configureStore';

export type WildfireFeatureFieldName = 'OBJECTID' | 'IrwinID' | 'GlobalID' | 'UniqueFireIdentifier' | 'IncidentName' | 'IncidentTypeCategory' | 'DiscoveryAcres' | 'DailyAcres' | 'CalculatedAcres' | 'FinalAcres' | 'PercentContained' | 'FireDiscoveryDateTime' | 'POOCounty' | 'POOState' | 'FireCause'

export interface WildfireFeature {
    attributes: {
        OBJECTID: number;
        // Unique identifier assigned to each incident record in both point and perimeter layers.
        IrwinID: string;
        GlobalID: string;
        // Unique identifier assigned to each wildland fire. yyyy = calendar year, SSUUUU = Point Of Origin (POO) protecting unit identifier (5 or 6 characters), xxxxxx = local incident identifier (6 to 10 characters)
        UniqueFireIdentifier: string;
        IncidentName: string;
        // This is a breakdown of events into more specific categories.
        IncidentTypeCategory: string;
        // An estimate of acres burning upon the discovery of the fire.
        DiscoveryAcres: number;
        // A measure of acres reported for a fire.
        DailyAcres: number;
        // A measure of acres calculated (i.e., infrared) from a geospatial perimeter of a fire.
        CalculatedAcres: number;
        // The measure of acres within the final perimeter of a fire. More specifically, the number of acres within the final fire perimeter of a specific, individual incident, including unburned and unburnable islands.
        FinalAcres: number;
        PercentContained: number;
        // The date and time a fire was reported as discovered or confirmed to exist. May also be the start date for reporting purposes. 
        FireDiscoveryDateTime: number;
        // The date and time of the latest approved ICS-209 report.
        ICS209ReportDateTime: number;
        ContainmentDateTime: number;
        ControlDateTime: number;
        FireOutDateTime: number;
        ModifiedOnDateTime: number;
        POOCounty: string;
        POOState: string;
        FireCause: string;
        FireCauseGeneral: string;
        // A code that identifies one of the wildland fire geographic area coordination centers. A geographic area coordination center is a facility that is used for the coordination of agency or jurisdictional resources in support of one or more incidents within a geographic coordination area.
        GACC: string;
        TotalIncidentPersonnel: number;
        // The incident management organization for the incident, which may be a Type 1, 2, or 3 Incident Management Team (IMT), a Unified Command, a Unified Command with an IMT, National Incident Management Organization (NIMO), etc. This field is null if no team is assigned.
        IncidentManagementOrganization: string;
        // The highest management level utilized to manage a wildland fire event.
        FireMgmtComplexity: string;
        ResidencesDestroyed: string;
        OtherStructuresDestroyed: string;
        Injuries: number;
        Fatalities: number;
        PredominantFuelGroup: string;
        PredominantFuelModel: string;
        PrimaryFuelModel: string;
        IsValid: number;
        IncidentTypeKind: string;
    },
    geometry: {
        x: number;
        y: number;
    },
    classBreak?: number;
};

interface WildfireLoadedAction {
    type: string;
    payload: WildfireFeature[];
};

interface VisibleFeaturesChangedAction {
    type: string;
    payload: string[]
}

interface FeatureChangedAction {
    type: string;
    payload: WildfireFeature | null;
};

interface WildfiresInitialState {
    byUniqueId: {
        [id:string]: WildfireFeature
    };
    visibleFeatureUniqueIds: string[];
    definitionExpression:string;
    feature2FlyTo: WildfireFeature;
    feature2OpenPopup: WildfireFeature;
};

const slice = createSlice({
    name: 'wildfires',
    initialState: {
        byUniqueId: {},
        visibleFeatureUniqueIds: [],
        definitionExpression: 'PercentContained < 100',
        feature2FlyTo: null
    } as WildfiresInitialState,
    reducers: {
        featuresLoaded: (state, action:WildfireLoadedAction)=>{
            const features = action.payload;

            features.forEach(feature=>{
                const { UniqueFireIdentifier } = feature.attributes;
                state.byUniqueId[UniqueFireIdentifier] = feature;
                // console.log( feature)
            });
        },
        visibleFeaturesChanged: (state, action:VisibleFeaturesChangedAction)=>{
            const uniqueIds = action.payload;
            state.visibleFeatureUniqueIds = uniqueIds;
        },
        feature2FlyToChanged: (state, action:FeatureChangedAction)=>{
            state.feature2FlyTo = action.payload;
        },
        feature2OpenPopupChanged: (state, action:FeatureChangedAction)=>{
            state.feature2OpenPopup = action.payload;
        },
    }
});

const {
    reducer,
} = slice;

const { 
    featuresLoaded,
    visibleFeaturesChanged,
    feature2FlyToChanged,
    feature2OpenPopupChanged
} = slice.actions;

let delayforOpenPopup:number;

export const loadWildfires = (features: WildfireFeature[])=>(dispatch:StoreDispatch, getState:StoreGetState)=>{
    if(features){
        dispatch(featuresLoaded(features));
    }
};

export const updateVisibleFeatures = (uniqueIds: string[])=>(dispatch:StoreDispatch, getState:StoreGetState)=>{
    dispatch(visibleFeaturesChanged(uniqueIds));
};

export const updateWildfireFeature2FlyTo = (feature: WildfireFeature)=>(dispatch:StoreDispatch, getState:StoreGetState)=>{
    dispatch(feature2FlyToChanged(feature));
};

export const updateWildfireFeature2OpenPopup = (feature: WildfireFeature)=>(dispatch:StoreDispatch, getState:StoreGetState)=>{

    clearTimeout(delayforOpenPopup);

    if(!feature){
        dispatch(feature2OpenPopupChanged(feature));
    } else {

        delayforOpenPopup = setTimeout(() => {
            dispatch(feature2OpenPopupChanged(feature));
        }, 500);
    }
    
};

export const visibleFeaturesSelector = createSelector(
    (state:RootState)=>state.wildfires.byUniqueId,
    (state:RootState)=>state.wildfires.visibleFeatureUniqueIds,
    (byUniqueId, visibleFeatureUniqueIds)=>{
        return visibleFeatureUniqueIds.map(id=>{
            return byUniqueId[id];
        });
    }
);


export const allFeaturesSelector = createSelector(
    (state:RootState)=>state.wildfires.byUniqueId,
    (byUniqueId)=>{
        const features: WildfireFeature[] = Object.keys(byUniqueId).map(id=>{
            return byUniqueId[id];
        });

        return features;
    }
);

export const definitionExpressionSelector = createSelector(
    (state:RootState)=>state.wildfires.definitionExpression,
    (definitionExpression)=>definitionExpression
);

export const feature2FlyToSelector = createSelector(
    (state:RootState)=>state.wildfires.feature2FlyTo,
    (feature2FlyTo)=>feature2FlyTo
);


export const feature2OpenPopupSelector = createSelector(
    (state:RootState)=>state.wildfires.feature2OpenPopup,
    (feature2OpenPopup)=>feature2OpenPopup
)

export default reducer;

