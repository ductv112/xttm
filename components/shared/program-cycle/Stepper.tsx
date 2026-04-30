'use client';

import * as React from 'react';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { StepStatus, StepperStep } from './types';

export interface StepperProps {
  steps: StepperStep[];
  currentIndex: number;
  onStepClick?: (index: number) => void;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

function getStepStatus(index: number, currentIndex: number): StepStatus {
  if (index < currentIndex) return 'completed';
  if (index === currentIndex) return 'current';
  return 'upcoming';
}

/**
 * Stepper hiển thị tiến độ wizard 5 bước (CYCLE-01..04 wizard tạo chu kỳ).
 *
 * - completed steps clickable (gọi onStepClick), cursor-pointer + check icon
 * - current step: ring-4 ring-blue-200 + step number font-semibold
 * - upcoming steps disabled (cursor-not-allowed), step number text-slate-500
 *
 * Aria: role="tablist" cho parent, role="tab" + aria-current="step" cho current.
 */
export function Stepper({
  steps,
  currentIndex,
  onStepClick,
  orientation = 'horizontal',
  className,
}: StepperProps) {
  const isVertical = orientation === 'vertical';

  return (
    <ol
      role="tablist"
      aria-orientation={orientation}
      className={cn(
        'w-full',
        isVertical ? 'flex flex-col gap-3' : 'flex items-start',
        className,
      )}
    >
      {steps.map((step, index) => {
        const status = getStepStatus(index, currentIndex);
        const isClickable = status === 'completed' && typeof onStepClick === 'function';
        const isLast = index === steps.length - 1;

        const handleClick = () => {
          if (isClickable) onStepClick?.(index);
        };

        const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
          if (!isClickable) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onStepClick?.(index);
          }
        };

        return (
          <li
            key={step.id}
            role="tab"
            aria-current={status === 'current' ? 'step' : undefined}
            aria-selected={status === 'current'}
            className={cn(
              isVertical ? 'flex items-start gap-3' : 'flex flex-1 items-start',
              isVertical && !isLast && 'pb-3',
            )}
          >
            {/* Circle + label cluster */}
            <div
              className={cn(
                isVertical
                  ? 'flex items-start gap-3'
                  : 'flex flex-col items-center gap-2 min-w-0',
                isVertical ? '' : 'shrink-0',
              )}
            >
              <div
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : -1}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                aria-label={`Bước ${index + 1}: ${step.label}`}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2',
                  status === 'completed' &&
                    'bg-blue-700 text-white border-blue-700 cursor-pointer hover:bg-blue-800',
                  status === 'current' &&
                    'bg-blue-700 text-white border-blue-700 ring-4 ring-blue-200 cursor-default',
                  status === 'upcoming' &&
                    'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed',
                )}
              >
                {status === 'completed' ? (
                  <Check className="h-[18px] w-[18px]" aria-hidden="true" />
                ) : (
                  <span
                    className={cn(
                      'text-sm',
                      status === 'current' ? 'font-semibold' : 'font-semibold',
                    )}
                  >
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Label below (horizontal) or right (vertical) */}
              <div
                className={cn(
                  isVertical
                    ? 'flex-1 pt-1'
                    : 'flex flex-col items-center text-center max-w-[140px]',
                )}
              >
                <span
                  className={cn(
                    'text-sm',
                    status === 'current' && 'font-semibold text-slate-900',
                    status === 'completed' && 'text-slate-600',
                    status === 'upcoming' && 'text-slate-400',
                  )}
                >
                  {step.label}
                </span>
                {step.description ? (
                  <span className="text-sm text-slate-500 line-clamp-2 mt-0.5">
                    {step.description}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Connecting line */}
            {!isLast ? (
              isVertical ? (
                <div
                  className={cn(
                    'absolute left-5 top-10 h-full w-0.5',
                    index < currentIndex ? 'bg-blue-700' : 'bg-slate-200',
                  )}
                  aria-hidden="true"
                />
              ) : (
                <div
                  className={cn(
                    'flex-1 h-0.5 mt-5 mx-2',
                    index < currentIndex ? 'bg-blue-700' : 'bg-slate-200',
                  )}
                  aria-hidden="true"
                />
              )
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export default Stepper;
