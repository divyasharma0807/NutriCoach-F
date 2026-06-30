import React from 'react';
import './StepIndicator.css';

interface StepIndicatorProps { totalSteps: number; currentStep: number; stepLabels: string[]; }

export const StepIndicator: React.FC<StepIndicatorProps> = ({ totalSteps, currentStep, stepLabels }) => (
  <div className="step-indicator">
    {Array.from({ length: totalSteps }).map((_, index) => {
      const stepNumber = index + 1;
      const isCompleted = stepNumber < currentStep;
      const isCurrent = stepNumber === currentStep;
      return (
        <React.Fragment key={stepNumber}>
          <div className={`step-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${stepNumber > currentStep ? 'upcoming' : ''}`}>
            <div className="step-circle">{isCompleted ? '✓' : stepNumber}</div>
            <span className="step-label">{stepLabels[index]}</span>
          </div>
          {stepNumber < totalSteps && <div className={`step-line ${isCompleted ? 'completed' : ''}`}></div>}
        </React.Fragment>
      );
    })}
  </div>
);
