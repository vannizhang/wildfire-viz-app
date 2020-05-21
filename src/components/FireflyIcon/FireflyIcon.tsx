import * as React from 'react';
import styled from 'styled-components';

import IconImage from './FireSymbol.png';

interface Props {
    size?: number
};

const sizeLookup = [20, 40, 60, 80, 100];

const IconDiv = styled.div`
    position: relative;
    display: inline-block;
    height: 45px;
    width: 45px;
    background-image: url(${IconImage});
    background-repeat: no-repeat;
    background-position: center;
    background-size: ${ (props:Props) => sizeLookup[props.size] + '%'};
`;

const FireflyIcon:React.FC<Props> = ({
    size
})=>{
    return <IconDiv size={size}/>
};

export default FireflyIcon;