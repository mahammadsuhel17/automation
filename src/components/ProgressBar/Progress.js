import React from 'react'
import './Progress.css'
export const Progress = ({
    progress
}) => {
    const Parentdiv = {
        height: 30,
        width: '95%',
        borderRadius: 15,
        backgroundColor: "lightGray"
    }

    const Childdiv = {
        width: `${progress}%`,
    }

    return (
        <div className='Parentdiv'>
            <div className='Childdiv' style={Childdiv}>
                <p className='progresstext'>{`${progress}%`}</p>
            </div>
        </div>
    )
}

