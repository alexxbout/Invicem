"use client";

import type { HTMLAttributes, KeyboardEvent, MouseEvent, ReactNode } from "react";

/**
 * A button that also ticks the iPhone's haptic engine. Safari has no vibration API,
 * but a real tap on the label of a native switch (<input type="checkbox" switch>)
 * plays the system tick. Scripted clicks no longer count, so the tap target itself
 * has to be that label. Elsewhere it behaves like a plain button.
 */
export function Tap({
  onClick,
  disabled = false,
  className,
  children,
  ...rest
}: Omit<HTMLAttributes<HTMLLabelElement>, "onClick"> & {
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
  children?: ReactNode;
}) {
  const activate = (e: MouseEvent<HTMLElement>) => {
    // the label forwards each tap to its switch, which bubbles a second click back up
    if ((e.target as HTMLElement).tagName === "INPUT") return;
    if (!disabled) onClick?.(e);
  };
  const key = (e: KeyboardEvent<HTMLLabelElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    e.currentTarget.click();
  };
  // a label is inline by default; give it a button's box unless the caller set a display
  const display = /(^|\s)(block|inline-block|flex|inline-flex|grid|inline-grid|hidden)(\s|$)/.test(className ?? "") ? "" : "inline-block";
  return (
    <label
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      onClick={activate}
      onKeyDown={key}
      className={`${display} ${className ?? ""} text-center cursor-pointer select-none ${disabled ? "pointer-events-none" : ""}`}
      {...rest}
    >
      <input
        type="checkbox"
        // @ts-expect-error: the switch attribute is Safari-only and missing from React's types
        switch=""
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute size-px opacity-0"
      />
      {children}
    </label>
  );
}
