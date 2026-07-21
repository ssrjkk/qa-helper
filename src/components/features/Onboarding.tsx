import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RippleButton } from '../ui';

const ONBOARDING_KEY = 'qa-copilot-onboarding-seen';

interface OnboardingStep {
  icon: string;
  title: string;
  description: string;
}

const steps: OnboardingStep[] = [
  {
    icon: '🔑',
    title: 'Get an API Key',
    description: 'Use a free provider like Groq or DeepSeek — no credit card needed. Or bring your own Claude/OpenAI key.',
  },
  {
    icon: '📋',
    title: 'Pick a Task Type',
    description: 'Choose from 17 QA tasks: Test Plans, Test Cases, Automation, Bug Reports, Security Checks, and more.',
  },
  {
    icon: '✏️',
    title: 'Describe Your Context',
    description: 'Paste your code, describe the feature, or use a preset template. The more detail, the better the output.',
  },
  {
    icon: '🚀',
    title: 'Execute & Export',
    description: 'Hit Execute and get a professional QA artifact. Copy, export as Markdown/PDF/JSON, or save to your project.',
  },
];

export function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markOnboardingSeen(): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, 'true');
  } catch {
    // Storage unavailable — skip silently
  }
}

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const handleSkip = useCallback(() => {
    markOnboardingSeen();
    onComplete();
  }, [onComplete]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep(s => s + 1);
    } else {
      markOnboardingSeen();
      onComplete();
    }
  }, [currentStep, onComplete]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSkip();
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleNext, handleSkip]);

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(s => s - 1);
    }
  };

  const isLast = currentStep === steps.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleSkip} />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-300 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            aria-label="Skip onboarding"
          >
            Skip ✕
          </button>
        </div>

        <div className="p-8 pb-4">
          <div className="text-center mb-2">
            <h2 className="text-xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
              Welcome to QA Copilot
            </h2>
            <p className="text-sm text-gray-500 mt-1">AI-powered QA in 4 steps</p>
          </div>
        </div>

        <div className="px-8 pb-6 min-h-[200px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ x: direction * 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction * -40, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center text-center"
            >
              <div className="text-5xl mb-4">{steps[currentStep].icon}</div>
              <h3 className="text-lg font-semibold text-gray-200 mb-2">
                {steps[currentStep].title}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                {steps[currentStep].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="px-8 pb-6">
          <div className="flex items-center gap-2 mb-5 justify-center">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > currentStep ? 1 : -1); setCurrentStep(i); }}
                className={`w-2 h-2 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
                  i === currentStep
                    ? 'bg-purple-400 w-6'
                    : i < currentStep
                      ? 'bg-purple-400/40'
                      : 'bg-white/10'
                }`}
                aria-label={`Step ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 text-gray-300 rounded-xl text-sm hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                Back
              </button>
            )}
            <RippleButton
              onClick={handleNext}
              className={`flex-1 !py-2.5 !text-sm ${currentStep === 0 ? 'w-full' : ''}`}
            >
              {isLast ? "Let's Go 🚀" : 'Next'}
            </RippleButton>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
