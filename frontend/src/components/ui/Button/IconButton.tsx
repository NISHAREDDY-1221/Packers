// @ts-nocheck
import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import Button from './Button';
import type { ButtonProps } from './Button';

export interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: LucideIcon;
  iconSize?: number;
  'aria-label': string;
}

const IconButton = ({ icon: Icon, iconSize = 16, className = '', ...props }: IconButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`p-1.5 ${className}`}
      {...props}
    >
      <Icon size={iconSize} />
    </Button>
  );
};

export default IconButton;

