import { useEffect, useState } from 'react'

const XPPopup = ({ popups, onRemove }) => {
    return (
        <>
            {popups.map(popup => (
                <XPBubble key={popup.id} popup={popup} onDone={() => onRemove(popup.id)} />
            ))}
        </>
    )
}

const XPBubble = ({ popup, onDone }) => {
    const [visible, setVisible] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false)
            setTimeout(onDone, 300)
        }, 1500)
        return () => clearTimeout(timer)
    }, [onDone])

    if (!visible) return null

    return (
        <div
            className="xp-popup"
            style={{
                left: popup.x,
                top: popup.y
            }}
        >
            <span className="xp-amount">+{popup.xp} XP ⭐</span>
            {popup.bonus && <span className="xp-bonus">{popup.bonus}</span>}
        </div>
    )
}

export default XPPopup
