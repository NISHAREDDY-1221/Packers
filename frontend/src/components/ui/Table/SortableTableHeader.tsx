// @ts-nocheck
import { SortIcon } from '..';

export interface SortableTableHeaderProps {
  field: string;
  label: string;
  currentField: string | null;
  direction: 'asc' | 'desc' | null;
  onSort: (field: string) => void;
  className?: string;
}

const SortableTableHeader = ({
  field,
  label,
  currentField,
  direction,
  onSort,
  className = '',
}: SortableTableHeaderProps) => {
  const handleClick = () => {
    onSort(field);
  };

  const isSortable = !!onSort;

  return (
    <th
      className={`px-2 py-3 text-center ${
        isSortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors' : ''
      } ${className}`}
      onClick={isSortable ? handleClick : undefined}
    >
      <div className="flex items-center justify-center gap-1 sm:gap-1.5">
        <span className="text-[10px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{label}</span>
        {isSortable && (
          <SortIcon
            field={field}
            currentField={currentField}
            direction={direction}
            size={12}
          />
        )}
      </div>
    </th>
  );
};

export default SortableTableHeader;


