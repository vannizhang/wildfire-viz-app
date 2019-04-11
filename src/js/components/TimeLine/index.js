import './style.scss';

import React from 'react';
import moment from 'moment';
import { stringFns } from 'helper-toolkit';
import config from '../../core/config';

const FIELD_NAME_START_DATE = config.fields.start_date;
const PCT_CONTAINED_FIELD_NAME = config.fields.pct_contained;
const FIRE_NAME_FIELD_NAME = config.fields.name;
// const FIELD_NAME_INTERNAL_ID = config.fields.internal_id;

class TimeLine extends React.PureComponent {

    constructor(props){
        super(props);

        // console.log('TimeLine props >>>', this.props);
        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
        this.onClick = this.onClick.bind(this);
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

        return fires;
    };

    compareMonthVal(d1, d2){
        d1 = new Date(d1);
        d2 = new Date(d2);
        return (d1 && d2 && d1.getMonth() !== d2.getMonth()) ? true: false; 
    };

    onMouseEnter(evt){
        // console.log(evt.currentTarget.dataset.fireId);
        const oid = evt.currentTarget.dataset.fireId || -1;
        this.props.onMouseEnter(oid);
    }

    onMouseLeave(){
        this.props.onMouseLeave();
    }

    onClick(evt){
        const oid = evt.currentTarget.dataset.fireId || -1;
        this.props.onClick(oid);
    }

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

                const oid = fire.attributes.OBJECTID;
                const pctContained = fire.attributes[PCT_CONTAINED_FIELD_NAME];
                const fireName = fire.attributes[FIRE_NAME_FIELD_NAME];
                const legendClass = fire.classBreak;

                return (
                    <div key={'fire-info'+i} className='leader-half trailer-half fire-info' data-fire-id={oid} onClick={this.onClick} onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
                        <div className='inline-block font-size--3 padding-left-half margin-right-half cursor-pointer'><span><strong>{stringFns.capitalizeFirstLetter(fireName)} Fire</strong>  <br/> {pctContained}% contained</span></div>
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