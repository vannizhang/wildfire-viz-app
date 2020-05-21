import aixos from 'axios';
import { add, isAfter } from 'date-fns';

// import {
//     WildfireFeatureFieldName
// } from '../store/reducers/wildfires';

// import {
//     MapConfig
// } from '../AppConfig';

interface GenerateRendererOptions {
    url: string;
    classificationField: string;
    breakCount?: number;
    where?: string;
}

export interface ClassBreakInfo {
    classMaxValue: number;
    label: string;
}

export interface GenerateRendererResponse {
    classBreakInfos: ClassBreakInfo[];
    field: string;
    type: string;
};

const LOCALSTORAGE_KEY_CLASS_BREAK_RENDERER = 'WildfireAppClassBreakRendererInfo';

const getRendererFromLocalStorage = ()=>{

    // clean up
    const OLD_LOCALSTORAGE_KEY_CLASS_BREAK_RENDERER = 'classBreakRendererInfo';
    localStorage.removeItem(OLD_LOCALSTORAGE_KEY_CLASS_BREAK_RENDERER);

    const itemFromLocalStorage = localStorage.getItem(LOCALSTORAGE_KEY_CLASS_BREAK_RENDERER) 
        ? JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY_CLASS_BREAK_RENDERER)) 
        : null;

    if(!itemFromLocalStorage){
        return null;
    }

    const { expiration, data } = itemFromLocalStorage;

    const hasExpired = isAfter(new Date(), new Date(expiration));

    return !hasExpired && data ? data : null;
};

const save2LocalStorage = (data:GenerateRendererResponse )=>{

    const expiration = add(new Date(), { 
        days: 2 
    }).getTime();

    if(data){

        const data2Save = {
            data,
            expiration
        };

        localStorage.setItem(LOCALSTORAGE_KEY_CLASS_BREAK_RENDERER, JSON.stringify(data2Save));
    }
};

export const getClassBreakRenderer = async({
    url,
    classificationField,
    breakCount = 5,
    where = '1=1'
}:GenerateRendererOptions): Promise<GenerateRendererResponse>=>{

    const cachedData = getRendererFromLocalStorage();

    if(cachedData){
        return cachedData;
    }

    const requestUrl = url + '/generateRenderer';

    const response = await aixos.get(requestUrl, {
        params: {
            classificationDef: {
                type:"classBreaksDef",
                breakCount,
                classificationField,
                classificationMethod: "esriClassifyNaturalBreaks"
            },
            where,
            f: 'json'
        }
    });

    const data:GenerateRendererResponse = response.data;
    // console.log(data);

    save2LocalStorage(data);

    return data;
}