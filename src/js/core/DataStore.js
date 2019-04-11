import axios from "axios";

import config from './config';

const Promise = require('es6-promise').Promise;

const WILDFIRE_ACTIVITY_BASE_URL = "https://utility.arcgis.com/usrsvcs/servers/fc88a2aa759f4ac28e63d2f58b2815cc/rest/services/LiveFeeds/Wildfire_Activity/MapServer";
const URL_QUERY_WILDFIRE_ACTIVITY = WILDFIRE_ACTIVITY_BASE_URL + "/0/query";
const URL_QUERY_WILDFIRE_PERIMETER = WILDFIRE_ACTIVITY_BASE_URL + "/2/query";
const REQUEST_URL_WILDFIRE_GENERATE_RENDERER = WILDFIRE_ACTIVITY_BASE_URL + "/dynamicLayer/generateRenderer";

const FIELD_NAME = {
    area: config.fields.area,
    pctContained: config.fields.pct_contained,
    startDate: config.fields.start_date,
    reportDate: config.fields.report_date,
    name: config.fields.name
};

const DataStore = function(options={}){

    const state = {
        activeFires: [],
        activeFiresDict: {}
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

        data.forEach(d=>{
            const key = d.attributes.OBJECTID;
            state.activeFiresDict[key] = d;
        })

        // console.log(state.activeFiresDict);
    };

    const getActiveFireByOID = (OID=-1)=>{
        return state.activeFiresDict[OID];
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
    };

    const searchFireByExtent = (extent=null, shouldReturnOidOnly=false)=>{

        const activeFires= getActiveFiresInMapExtent(extent);

        if(activeFires[0]){
            return shouldReturnOidOnly ? activeFires[0].attributes.OBJECTID : activeFires[0];
        }

        return null;

    };

    const searchFireByName = (name='')=>{

        if(name){
            const textToSearch = new RegExp('^' + name + '.*$', 'i');

            const fires = state.activeFires.filter(d=>{
                return d.attributes[FIELD_NAME.name].match(textToSearch);
            });

            return fires;
        }

        return state.activeFires

        
    }

    const formatAcitveFiresData = (features=[], classBreakInfo)=>{

        const activeFires = [];

        features.forEach(feature=>{

            // some features have missing start date, if so, use report date instead
            if(!feature.attributes[FIELD_NAME.startDate]){
                feature.attributes[FIELD_NAME.startDate] = feature.attributes[FIELD_NAME.reportDate];
            }

            for(let i = 0, len = classBreakInfo.length; i < len; i++){
                if(feature.attributes[FIELD_NAME.area] <= classBreakInfo[i].classMaxValue){
                    feature.classBreak = i;
                    break;
                }
            }

            // only push feature with valid start date into the final data list
            if(feature.attributes[FIELD_NAME.startDate]){
                activeFires.push(feature);
            }
            
        });

        return activeFires;
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
        getActiveFiresInMapExtent,
        getActiveFireByOID,
        searchFireByExtent,
        searchFireByName
    };
};

export default DataStore;