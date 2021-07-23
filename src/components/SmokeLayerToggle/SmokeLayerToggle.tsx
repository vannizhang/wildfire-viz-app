import React from 'react';
import { format } from 'date-fns';
import './style.scss'
import classnames from 'classnames'

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

    const getIndicators = ()=>{
        const indicators:JSX.Element[] = [];

        for(let i = 0 ; i < 48; i++){

            const classname = classnames('smoke-forecast-time-indicator', {
                'is-active': i === 0
            })

            const indicator = (
                <div className={classname} key={i}></div>
            )

            indicators.push(indicator)
        }

        const pauseIcon = (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" height="16" width="16">
                <path d="M2 1h5v14H2zm12 0H9v14h5z"/><path fill="none" d="M0 0h16v16H0z"/>
            </svg>
        );

        const playIcon = (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" height="16" width="16">
                <path d="M4 1.571l10 6.43-10 6.428z"/><path fill="none" d="M0 0h16v16H0z"/>
            </svg>
        );

        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginTop: '.5rem',
                }}
            >
                <div
                    className='play-pause-btn'
                >
                    { pauseIcon }
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-around',
                        flexGrow: 1,
                        height: '100%'
                    }}
                >
                    { indicators }
                </div>
            </div>

        )
    }

    return (
        <div
            style={{
                'padding': '.5rem',
                'background': 'rgba(103,0,67,0.5)'
            }}
        >
            <div
                className='cursor-pointer font-size--3'
                onClick={onClick}
            >
                { getCheckboxIcon() }
                { getLabel() }
            </div>

            { getIndicators() }
        </div>

    )
};

export default SmokeLayerToggle;