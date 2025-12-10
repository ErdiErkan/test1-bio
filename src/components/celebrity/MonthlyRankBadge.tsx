interface MonthlyRankBadgeProps {
  rank: number;
}

export function MonthlyRankBadge({ rank }: MonthlyRankBadgeProps) {
  // Only show for top 100
  if (rank > 100) return null;

  let bgColor = 'bg-blue-600';
  let textColor = 'text-white';
  let ringColor = 'ring-blue-300';
  let label = `#${rank}`;
  let icon = '🔥';

  if (rank === 1) {
    bgColor = 'bg-yellow-400';
    textColor = 'text-yellow-950';
    ringColor = 'ring-yellow-200';
    label = '#1';
    icon = '👑';
  } else if (rank === 2) {
    bgColor = 'bg-gray-300';
    textColor = 'text-gray-900';
    ringColor = 'ring-gray-200';
    label = '#2';
    icon = '🥈';
  } else if (rank === 3) {
    bgColor = 'bg-amber-700';
    textColor = 'text-amber-100';
    ringColor = 'ring-amber-400';
    label = '#3';
    icon = '🥉';
  }

  const className = `absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg ring-2 font-bold text-sm backdrop-blur-sm ${bgColor} ${textColor} ${ringColor}`;

  return (
    <div className={className}>
      <span className="text-base leading-none">{icon}</span>
      <div className="flex flex-col leading-none">
        <span className="text-[9px] uppercase opacity-80 font-semibold tracking-wider">Monthly</span>
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
}
