const TagBadge = ({
  tag,
  active,
  onClick,
}: {
  tag: string;
  active?: boolean;
  onClick?: () => void;
}) => {
  const base =
    'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors';
  const style = active
    ? 'bg-battle-orange text-white'
    : onClick
      ? 'bg-white/10 text-gray-300 hover:bg-battle-orange/30 hover:text-white cursor-pointer'
      : 'bg-white/10 text-gray-400';

  return (
    <span className={`${base} ${style}`} onClick={onClick}>
      {tag}
    </span>
  );
};

export default TagBadge;
