// @ts-nocheck
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Button from './Button';
import type { ButtonProps } from './Button';

export interface SecondaryButtonProps extends Omit<ButtonProps, 'variant'> {
  children: ReactNode;
}

const SecondaryButton = ({ children, ...props }: SecondaryButtonProps) => {
  return <Button variant="secondary" {...props}>{children}</Button>;
};

export default SecondaryButton;

