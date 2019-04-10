import './style.scss';

import React from 'react';
import moment from 'moment';
import { numberFns } from 'helper-toolkit';

import config from '../../core/config';

class InfoWindow extends React.Component {

    constructor(props){
        super(props);

        this.state = {
            left: 0,
            top: 0
        }
    };

    getContent(){
        if(!this.props.data || !this.props.data.attributes){
            return null;
        }

        const affectedArea = this.props.data.attributes[config.fields.area] || 0;
        const pctContained = this.props.data.attributes[config.fields.pct_contained] || 0;
        const startDate = this.props.data.attributes[config.fields.start_date];
        const startDateFormatted = moment(startDate).format("MMMM Do YYYY");
        const name = this.props.data.attributes[config.fields.name] || 'No Name';
        const state = config.state_fullname[this.props.data.attributes[config.fields.state]] || '';
        const fireName = name.toLowerCase() + ' fire';
        const newsLink = 'https://news.google.com/search?q=' + fireName;
        const twitterLink = 'https://twitter.com/search?q=' + fireName;
        const facebookLink = 'https://www.facebook.com/search/top/?q=' + fireName;

        const infoWindowContent = (
            <div className='customized-info-window'>
                <div className='customized-popup-header'>
                    <span className='font-size--3'>Start Date: {startDateFormatted}</span>
                    <span className='js-close-info-window icon-ui-close avenir-bold cursor-pointer font-size--3 right'></span>
                </div>
                <div className='leader-quarter trailer-quarter'>
                    <p className='trailer-half font-size--2'> 
                        The <strong>{fireName}</strong> in {state} is estimated to be {numberFns.numberWithCommas(affectedArea)} acres and <strong>{pctContained}%</strong> contained.
                    </p>
                    <div className='info-window-links padding-leader-half font-size--3'>
                        <a href={newsLink} target='_blank' className=''>News</a>
                        <a href={twitterLink} target='_blank' className='margin-left-half'>Twitter</a>
                        <a href={facebookLink} target='_blank' className='margin-left-half'>Facebook</a>
                    </div>
                </div>
            </div>

        );

        return this.props.data ? infoWindowContent : null;
    }

    updateInfoWindowPosition(){
        const infoWindowHeight = document.getElementById('customizedInfoWindowDiv').offsetHeight;

        this.setState({
            left: this.props.position.x + 20
        });

        this.setState({
            top: this.props.position.y - (infoWindowHeight / 2)
        });

    }

    componentDidUpdate(prevPros){
        // console.log()

        if(prevPros.position !== this.props.position){
            this.updateInfoWindowPosition()
        }
        
    }

    render(){

        return(
            <div id='customizedInfoWindowDiv' style={{
                position: 'absolute',
                left: `${this.state.left}px`,
                top: `${this.state.top}px`,
                backgroundColor: 'rgba(26, 0, 17, 0.85)'
            }}>
                {this.getContent()}
            </div>
        )

    };

};

export default InfoWindow;