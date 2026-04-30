// Card grid wrapper — RSC (no client interactivity here, leaves children to handle clicks).
// Plan 03-05 — responsive: 3 cols desktop / 2 cols tablet / 1 col mobile.

import { CycleCard } from './CycleCard';
import type { CycleListItem } from '../_actions/types';

export type CycleListGridProps = {
  cycles: CycleListItem[];
};

export function CycleListGrid({ cycles }: CycleListGridProps) {
  return (
    <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6">
      {cycles.map((cycle) => (
        <CycleCard key={cycle.id} cycle={cycle} />
      ))}
    </div>
  );
}

export default CycleListGrid;
