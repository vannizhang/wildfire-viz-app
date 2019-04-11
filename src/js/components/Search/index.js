import './style.scss';

import React from 'react';
import config from '../../core/config';

class Search extends React.PureComponent {

    constructor(props){
        super(props);

        this.state = {
            isSuggestionListVisible: false,
        }

        this.toggleSuggestionList = this.toggleSuggestionList.bind(this);
        this.onSuggestItemClick= this.onSuggestItemClick.bind(this);
        this.onInput = this.onInput.bind(this);
    };

    toggleSuggestionList(){
        this.setState((state)=>{
            return {
                isSuggestionListVisible: !state.isSuggestionListVisible
            };
        })
    }

    onSuggestItemClick(evt){
        const val = evt.currentTarget.dataset.fireName;
        this.props.onSelect(val);
        this.toggleSuggestionList();

        document.getElementById('fireQueryInput').value = val;
        // console.log(val);
    }

    onInput(evt){
        const val = evt.currentTarget.value;
        this.props.onSelect(val);
        // console.log(evt.currentTarget.value);
    }

    getSuggestionList(){

        let data = JSON.parse(JSON.stringify(this.props.data)) || [];

        data.sort((a, b) => (a.attributes[config.fields.name] > b.attributes[config.fields.name]) ? 1 : -1);

        const suggestionListItems = data.map((d, i)=>{
            const fireName = d.attributes[config.fields.name];
            return (<div key={`suggestion-item-${i}`} className='suggestion-item cursor-pointer' data-fire-name={fireName} onClick={this.onSuggestItemClick}><span className='font-size--2'>{fireName}</span></div>)
        });

        return(
            <div className={`suggestion-list-container`}>
                {suggestionListItems}
            </div>
        )
    }

    render(){
        const suggestionList = this.getSuggestionList();

        return(
            <div id='searchInputDiv' className='search-input-wrap'>
                <input id='fireQueryInput' type="text" placeholder="Search by fire name..." className="customized-input" onInput={this.onInput}></input>
                <div className='search-input-btns-wrap text-center cursor-point'>
                    <div className='search-input-btn toggle-suggestion-list-btn inline-block right' onClick={this.toggleSuggestionList}>
                        { this.state.isSuggestionListVisible ? <span className='icon-ui-up'></span> : <span className='icon-ui-down'></span>  }
                    </div>
                </div>
                <div>
                    {this.state.isSuggestionListVisible ? suggestionList : null}
                </div>

            </div>
        );
    };

};

export default Search;