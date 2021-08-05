import * as React from 'react';
import styled from 'styled-components';
import { numberFns } from 'helper-toolkit-ts';
import {
    FireflyIcon
} from '..';

const LegendContainer = styled.div`
    display: flex;
    justify-content: space-between;
    flex-direction: row-reverse;
    padding: .5rem 1rem;
`;

const LegendItem = styled.div`
    text-align: center;
`;

interface Props {
   labels: string[] 
};

const Legend:React.FC<Props> = ({
    labels
})=>{

    const getItems = ()=>{

        return labels.map((val, index)=>{
            return (
                <LegendItem key={`legend-item-${index}`}>
                    <FireflyIcon 
                        size={index}
                    />
                    <div className='font-size--3'>
                        <span>{val}</span>
                    </div>
                </LegendItem>

            )
        });
    };

    return (
        <LegendContainer>
            { getItems() }
        </LegendContainer>
    );
};

export default Legend;