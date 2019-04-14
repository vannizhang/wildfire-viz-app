import React from 'react';
import moment from 'moment';

class Checkbox extends React.PureComponent {

    constructor(props){
        super(props);

        this.state = {
            isChecked: false
        };

        this.toggleIsChecked = this.toggleIsChecked.bind(this);
    };

    toggleIsChecked(){
        this.setState({
            isChecked: !this.state.isChecked
        },()=>{
            this.props.onChange(this.state.isChecked);
        });
    }

    render(){

        const checkboxIcon = this.state.isChecked ? <span className="icon-ui-checkbox-checked"></span> : <span className="icon-ui-checkbox-unchecked"></span>;
        const forecastTime = this.state.isChecked ? <span className='margin-left-quarter'>({moment(this.props.smokeForecastTime).format('MMMM Do, h:mm a')})</span> : '';

        return(
            <div className='checkbox-control font-size--3'>
                <div className="checkbox-icon inline-block" onClick={this.toggleIsChecked}>
                    {checkboxIcon}
                </div>
                <span className='checkbox-label'>Smoke forecast {forecastTime}</span>
            </div>
        );
    };

};

export default Checkbox;