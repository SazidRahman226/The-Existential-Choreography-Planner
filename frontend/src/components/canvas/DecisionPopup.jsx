import { memo } from 'react'

/**
 * DecisionPopup — Appears when the runner reaches a Decision node.
 * Shows the question and edge choices as buttons with destination labels.
 */
const DecisionPopup = ({ decision, onChoose }) => {
    if (!decision) return null

    return (
        <div className="decision-popup-overlay">
            <div className="decision-popup">
                <div className="decision-popup-icon">❓</div>
                <h3 className="decision-popup-title">{decision.question}</h3>
                {decision.description && (
                    <p className="decision-popup-desc">{decision.description}</p>
                )}
                <div className="decision-popup-choices">
                    {decision.choices.map((choice, idx) => (
                        <button
                            key={choice.edgeId}
                            className={`decision-choice-btn choice-${idx}`}
                            onClick={() => onChoose(choice.targetId)}
                        >
                            <div className="choice-info">
                                <span className="choice-label">{choice.label}</span>
                                <span className="choice-target">→ {choice.targetName}</span>
                            </div>
                            <span className="choice-arrow">→</span>
                        </button>
                    ))}
                </div>
                {decision.choices.length === 0 && (
                    <p className="decision-popup-desc" style={{ color: '#ef4444' }}>
                        ⚠ No outgoing connections! Connect this decision node to other nodes first.
                    </p>
                )}
            </div>
        </div>
    )
}

export default memo(DecisionPopup)
