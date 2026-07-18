import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type SelectProps = {
  id?: string
  value: string
  onValueChange: (value: string) => void
  placeholder: string
  children: ReactNode
  error?: boolean
  disabled?: boolean
}

export function Select({
  id,
  value,
  onValueChange,
  placeholder,
  children,
  error = false,
  disabled = false,
}: SelectProps) {
  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        id={id}
        className={cn(
          'flex w-full items-center justify-between gap-3 border border-(--color-border) bg-(--color-surface) px-3 py-3 text-left text-sm text-(--color-text) outline-none transition hover:border-(--color-text) focus:border-(--color-blue) focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60',
          error && 'border-red-500 focus:border-red-500',
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="size-4 shrink-0 text-(--color-text-dim)" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="z-50 max-h-72 min-w-(--radix-select-trigger-width) overflow-hidden border border-(--color-border) bg-(--color-surface) text-(--color-text) shadow-[0_16px_40px_rgba(23,24,22,0.12)]"
          position="popper"
          sideOffset={6}
        >
          <SelectPrimitive.Viewport className="p-1">
            {children}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

type SelectItemProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Item>

export function SelectItem({ className, children, ...props }: SelectItemProps) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex cursor-pointer select-none items-center px-8 py-2.5 text-sm outline-none transition data-disabled:pointer-events-none data-highlighted:bg-(--color-panel) data-highlighted:text-(--color-text) data-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemIndicator className="absolute left-2 inline-flex items-center">
        <Check className="size-4" />
      </SelectPrimitive.ItemIndicator>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}
