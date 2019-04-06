import axios from "axios";

const Promise = require('es6-promise').Promise;

const WILDFIRE_ACTIVITY_BASE_URL = "https://utility.arcgis.com/usrsvcs/servers/fc88a2aa759f4ac28e63d2f58b2815cc/rest/services/LiveFeeds/Wildfire_Activity/MapServer";
const URL_QUERY_WILDFIRE_ACTIVITY = WILDFIRE_ACTIVITY_BASE_URL + "/0/query";
const URL_QUERY_WILDFIRE_PERIMETER = WILDFIRE_ACTIVITY_BASE_URL + "/2/query";
const REQUEST_URL_WILDFIRE_GENERATE_RENDERER = WILDFIRE_ACTIVITY_BASE_URL + "/dynamicLayer/generateRenderer";

const FIELD_NAME = {
    area: 'AREA_',
    pctContained: 'PER_CONT'
};

const DataStore = function(options={}){

    const state = {
        activeFires: [],
        // acriveFiresIndex
    }

    const init = async()=>{

        const where = `${FIELD_NAME.pctContained} < 100 AND ${FIELD_NAME.area} > 0`;

        const classBreakRendererInfo = await getClassBreakRendererInfo({ 
            classificationField: FIELD_NAME.area, 
            where 
        });

        let activeFires = await queryActiveFires({ where });

        activeFires = formatAcitveFiresData(activeFires.features, classBreakRendererInfo.classBreakInfos);

        setActiveFires(activeFires);

        return {
            activeFires,
            classBreakInfos: classBreakRendererInfo.classBreakInfos
        };

    };

    const setActiveFires = (data=[])=>{
        state.activeFires = data;
    };

    const getActiveFiresInMapExtent = (mapExtent=null)=>{
        if(mapExtent){
            const activeFiresInMapExt = state.activeFires.filter(d=>{
                const x = d.geometry.x;
                const y = d.geometry.y;
                const isInMapExt = x >= mapExtent.xmin && x <= mapExtent.xmax && y >= mapExtent.ymin && y <= mapExtent.ymax ? true : false;
                return isInMapExt;
            });
            return activeFiresInMapExt;
        }

        return state.activeFires;
    }

    const formatAcitveFiresData = (features=[], classBreakInfo)=>{

        return features.map(feature=>{

            for(let i = 0, len = classBreakInfo.length; i < len; i++){
                if(feature.attributes[FIELD_NAME.area] <= classBreakInfo[i].classMaxValue){
                    feature.classBreak = i;
                    break;
                }
            }

            return feature;
        });
    };

    const queryActiveFires = ({
        where = `${FIELD_NAME.pctContained} < 100 AND ${FIELD_NAME.area} > 0`,
        extentGeometry = null
    }={})=>{

        const params = {
            where,
            outFields: '*',
            f: 'json'
        };

        if(extentGeometry){
            params.geometry = JSON.stringify(extentGeometry);
            params.geometryType = 'esriGeometryEnvelope';
            params.spatialRel = 'esriSpatialRelIntersects';
        }

        return new Promise((resolve, reject)=>{

            axios.get(URL_QUERY_WILDFIRE_ACTIVITY, { 
                params 
            })
            .then(function (response) {
                const responseData = response.data;
                if(responseData.error){
                    reject(responseData.error);
                } else {
                    resolve(responseData);
                }
            })
            .catch(function (error) {
                reject(error);
            });

        });

    };

    const getClassBreakRendererInfo = (options={
        where: '1=1',
        classificationField: '',
    })=>{

        return new Promise((resolve, reject)=>{

            axios.get(REQUEST_URL_WILDFIRE_GENERATE_RENDERER, {
                params: {
                    classificationDef: {
                        "type":"classBreaksDef",
                        "classificationField": options.classificationField,
                        "classificationMethod": 'esriClassifyNaturalBreaks',
                        "breakCount": 5
                    },
                    layer: {
                        "source": {
                            "type":"mapLayer",
                            "mapLayerId": 0
                        }
                    },
                    where: options.where,
                    f: 'json',
                }
            })
            .then(function (response) {

                const responseData = response.data;

                if(responseData.error){
                    reject(responseData.error);
                } else{
                    resolve(responseData);
                }
            })
            .catch(function (error) {
                reject(error);
            });

        });
    };

    return {
        init,
        getActiveFiresInMapExtent
    };
};

export default DataStore;