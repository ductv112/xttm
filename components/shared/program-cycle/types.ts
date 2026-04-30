import type { LucideIcon } from 'lucide-react';

/**
 * Phase 3 visual primitives — type contract shared bởi Stepper / StatCard /
 * ProgramCycleStateMachineVisual. Plan 03-04+ chỉ pass props, không build từ scratch.
 */

export interface StepperStep {
  id: string;
  label: string;
  description?: string;
}

export type StepStatus = 'completed' | 'current' | 'upcoming';

export type StatCardTone = 'default' | 'success' | 'warning' | 'danger' | 'info';

export interface StatCardTrend {
  direction: 'up' | 'down' | 'flat';
  label: string;
}

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: StatCardTone;
  subtitle?: string;
  trend?: StatCardTrend;
  className?: string;
}
