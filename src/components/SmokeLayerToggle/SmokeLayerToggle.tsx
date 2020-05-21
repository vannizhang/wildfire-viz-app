import * as React from 'react';
import { format } from 'date-fns';

interface Props {
    isVisible: boolean;
    currentTime: number;
    onClick: ()=>void;
}

const SmokeLayerToggle:React.FC<Props> = ({
    isVisible,
    currentTime,
    onClick
})=>{

    const getCheckboxIcon = ()=>{
        return isVisible 
            ? <span className="icon-ui-checkbox-checked"></span>
            : <span className="icon-ui-checkbox-unchecked"></span>;
    };

    const getLabel = ()=>{
        const forcastTime = currentTime && isVisible
            ? <span className='margin-left-half'>({ format(new Date(currentTime), 'MMMM do, p') })</span>
            : null;

        return <span>
            Smoke forecast 
            {forcastTime}
        </span>
    };

    return (
        <div
            className='cursor-pointer font-size--3'
            style={{
                'padding': '.35rem 0'
            }}
            onClick={onClick}
        >
            { getCheckboxIcon() }
            { getLabel() }
        </div>
    )
};

export default SmokeLayerToggle;