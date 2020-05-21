import * as React from 'react';
import styled from 'styled-components';
import { WildfireFeature } from '../../store/reducers/wildfires';
import {
    UIConfig
} from '../../AppConfig';

const SearchContainer = styled.div`
    position: relative;
`;

const SearchInput = styled.input`
    background-color: ${UIConfig.ThemeColorDarkPurple};
    border: 1px solid ${UIConfig.ThemeColorYellow};
    color: ${UIConfig.ThemeColorYellow};

    &:focus {
        border-color: ${UIConfig.ThemeColorYellow};
        box-shadow: inset 0 1px 2px rgba(0,0,0,0.075), 0 0 5px ${UIConfig.ThemeColorYellow}
    }

    &::-webkit-input-placeholder { /* Chrome/Opera/Safari */
        color: #B77600;
    }
    &::-moz-placeholder { /* Firefox 19+ */
        color: #B77600;
    }
    &:-ms-input-placeholder { /* IE 10+ */
        color: #B77600;
    }
    &:-moz-placeholder { /* Firefox 18- */
        color: #B77600;
    }

`;

const SearchInputBtnWrap = styled.div`
    position: absolute;
    top: 0;
    right: 0;
    padding: 5px 0 5px;
    display: flex;
    justify-content:center;
    align-items:center;
    color: ${UIConfig.ThemeColorYellow};
    cursor: pointer;
`;

interface Props {
    data: WildfireFeature[];
    onChange: (val:string)=>void
}

const Search:React.FC<Props> = ({
    data,
    onChange
})=>{

    const inputRef = React.useRef<HTMLInputElement>();

    const [inputValue, setInputValue ] = React.useState<string>('');

    const handleInputChange = (event:React.ChangeEvent<HTMLInputElement>)=>{
        setInputValue(event.target.value);
    };

    React.useEffect(()=>{
        onChange(inputValue);
    }, [inputValue]);

    return(
        <SearchContainer>
            <SearchInput 
                ref={inputRef}
                type="text" 
                placeholder="Search by fire name..."
                value={inputValue}
                onChange={handleInputChange}
            ></SearchInput>

            <SearchInputBtnWrap>
                { inputValue ? ( <span className="icon-ui-close" onClick={setInputValue.bind(this, '')}></span> ) : null }
            </SearchInputBtnWrap>
        </SearchContainer>
    );
};

export default Search;
