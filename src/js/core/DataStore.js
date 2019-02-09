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

    const init = async()=>{

        const where = `${FIELD_NAME.pctContained} < 100 AND ${FIELD_NAME.area} > 0`;

        const classBreakRendererInfo = await getClassBreakRendererInfo({ 
            classificationField: FIELD_NAME.area, 
            where 
        });

        const activeFires = await getActiveFires({ where });

        // const perimeterForActiveFires = await getPeremeterForActiveFires({ where });
        // console.log('fires', formatAcitveFiresData(activeFires.features, classBreakRendererInfo.classBreakInfos));
        // console.log('classBreakRendererInfo', classBreakRendererInfo);

        return {
            activeFires: formatAcitveFiresData(activeFires.features, classBreakRendererInfo.classBreakInfos),
            classBreakInfos: classBreakRendererInfo.classBreakInfos
        };

    };

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

    const getActiveFires = (options={
        where: '1=1'
    })=>{

        return new Promise((resolve, reject)=>{

            axios.get(URL_QUERY_WILDFIRE_ACTIVITY, {
                params: {
                    where: options.where,
                    outFields: '*',
                    f: 'json'
                }
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

    // const getPeremeterForActiveFires = (options={
    //     where: '1=1'
    // })=>{

    //     return new Promise((resolve, reject)=>{

    //         axios.get(URL_QUERY_WILDFIRE_PERIMETER, {
    //             params: {
    //                 where: options.where,
    //                 outFields: '*',
    //                 f: 'json'
    //             }
    //         })
    //         .then(function (response) {
    //             console.log(response.data);

    //             if(response && response.data && !response.data.error){
    //                 resolve(response.data);
    //             } else {
    //                 reject([]);
    //             }
    //         })
    //         .catch(function (error) {
    //             reject(error);
    //         });

    //     });

    // };

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
        init
    };
};

export default DataStore;