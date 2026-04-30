'use client';

import * as React from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/clipboard';
import { cn } from '@/lib/utils';

export type CopyButtonProps = {
  value: string;
  /** Label visible bên cạnh icon khi variant="inline". Default: "Sao chép" */
  label?: string;
  /**
   * `icon` — chỉ render icon-only (24×24 button), tooltip qua aria-label.
   * `inline` — render icon + label text bên cạnh.
   */
  variant?: 'icon' | 'inline';
  /** Custom toast message. Default: "Đã sao chép vào bộ nhớ tạm" */
  successMessage?: string;
  /** Disable button (eg empty value) */
  disabled?: boolean;
  className?: string;
  /** Optional override for accessibility — defaults dùng `label` hoặc fallback */
  ariaLabel?: string;
};

const RESET_AFTER_MS = 2000;

/**
 * Copy-to-clipboard button với icon swap (copy → check 2s) + sonner toast.
 *
 * Wraps lib/clipboard.copyToClipboard (handles Clipboard API + execCommand fallback).
 */
export function CopyButton({
  value,
  label = 'Sao chép',
  variant = 'inline',
  successMessage = 'Đã sao chép vào bộ nhớ tạm',
  disabled,
  className,
  ariaLabel,
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = async () => {
    try {
      await copyToClipboard(value);
      setCopied(true);
      toast.success(successMessage);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), RESET_AFTER_MS);
    } catch (error) {
      console.error('CopyButton failed:', error);
      toast.error('Không thể sao chép. Vui lòng thử lại');
    }
  };

  const Icon = copied ? Check : Copy;
  const iconClass = cn('h-4 w-4', copied && 'text-green-600');

  if (variant === 'icon') {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleClick}
        disabled={disabled || !value}
        aria-label={ariaLabel ?? label}
        className={className}
      >
        <Icon className={iconClass} aria-hidden="true" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={disabled || !value}
      aria-label={ariaLabel}
      className={className}
    >
      <Icon className={iconClass} aria-hidden="true" />
      {copied ? 'Đã sao chép' : label}
    </Button>
  );
}

export default CopyButton;
