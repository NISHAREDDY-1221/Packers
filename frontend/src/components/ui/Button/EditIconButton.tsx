// @ts-nocheck
import { Edit } from 'lucide-react';
import IconButton from "./IconButton";
import type { IconButtonProps } from "./IconButton";

export interface EditIconButtonProps extends Omit<IconButtonProps, 'icon' | 'aria-label'> {
  onClick: () => void;
  size?: any;
  tooltip?: string;
  'aria-label'?: string;
}

const EditIconButton = ({
  onClick,
  size = 12,
  tooltip,
  'aria-label': ariaLabel,
  className = '',
  ...props
}: EditIconButtonProps) => {
  const defaultAriaLabel = ariaLabel || tooltip || 'Edit';
  const defaultClassName = 'text-blue-600 hover:bg-blue-50 rounded transition-colors';

  return (
    <IconButton
      icon={Edit}
      iconSize={size}
      aria-label={defaultAriaLabel}
      onClick={onClick}
      className={className || defaultClassName}
      title={tooltip || 'Edit'}
      {...props}
    />
  );
};

export default EditIconButton;

