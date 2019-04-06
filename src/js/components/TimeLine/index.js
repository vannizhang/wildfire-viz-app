import './style.scss';

import React from 'react';
import moment from 'moment';
import { stringFns } from 'helper-toolkit';
import config from '../../core/config';

const FIELD_NAME_START_DATE = config.fields.start_date;
const PCT_CONTAINED_FIELD_NAME = config.fields.pct_contained;
const FIRE_NAME_FIELD_NAME = config.fields.name;
const FIELD_NAME_INTERNAL_ID = config.fields.internal_id;

class TimeLine extends React.Component {

    constructor(props){
        super(props);

        // console.log('TimeLine props >>>', this.props);

    };

    prepareData(){

        let fires = JSON.parse(JSON.stringify(this.props.data));

        const firesByDate = {};
        const distinctDates = [];

        fires.sort((a,b)=>{
            return b.attributes[FIELD_NAME_START_DATE] - a.attributes[FIELD_NAME_START_DATE];
        });

        fires.forEach(fire=>{
            const date = moment(fire.attributes[FIELD_NAME_START_DATE]).startOf('day');

            if(!firesByDate[date]){

                firesByDate[date] = {
                    startDate: date,
                    fires: [fire],
                    isFirstItemInMonth: false
                };
                
                distinctDates.push(date);
            } else {
                firesByDate[date].fires.push(fire);
            }
        });

        fires = distinctDates.map( (d, idx)=>{
            const prevDate = distinctDates[idx - 1];
            const isMonFromCurDateDiff = this.compareMonthVal(d, prevDate);
            if(isMonFromCurDateDiff){
                firesByDate[d].isFirstItemInMonth = true;
            }
            return firesByDate[d];
        });

        console.log(firesByDate)

        return fires;
    };

    compareMonthVal(d1, d2){
        d1 = new Date(d1);
        d2 = new Date(d2);
        return (d1 && d2 && d1.getMonth() !== d2.getMonth()) ? true: false; 
    };

    render(){

        const data = this.prepareData();

        const timelineItems = data.map((d, idx)=>{

            const startDate = moment(d.startDate).format("MMM Do");
            const monthName = moment(d.startDate).format("MMMM");

            const monthTitle = (
                <div className='timeline-month-title text-center'>
                    <div className='padding-leader-quarter padding-trailer-quarter'>
                        <span className='avenir-bold'>{monthName}</span>
                    </div>
                </div>
            );

            const fireInfo = d.fires.map((fire, i)=>{

                const pctContained = fire.attributes[PCT_CONTAINED_FIELD_NAME];
                const fireName = fire.attributes[FIRE_NAME_FIELD_NAME];
                const legendClass = fire.classBreak;
                const fireID = fire.attributes[FIELD_NAME_INTERNAL_ID];

                return (
                    <div key={'fire-info'+i} className='leader-half trailer-half fire-info'>
                        <div className='inline-block font-size--3 padding-left-half margin-right-half'><span data-fire-id={fireID}><strong>{stringFns.capitalizeFirstLetter(fireName)} Fire</strong>  <br/> {pctContained}% contained</span></div>
                        <div className={`legend-icon legend-class-${legendClass}`}></div>
                    </div>
                );
            });

            const timelineItem = (
                <div key={'timeline-item-' + idx}>
                    {d.isFirstItemInMonth ? monthTitle : null}
                    <div className='timeline-item'>
                        <div className='date-info font-size--2'>{startDate}</div>
                        <div className='fire-info-wrap text-right'>
                            {fireInfo}
                        </div>
                    </div>
                </div>
            );

            return timelineItem;
        });

        return(
            <div id='timelineDiv'>
                {timelineItems}
            </div>
        );
    };

};

export default TimeLine;