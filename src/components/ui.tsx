import clsx from "clsx";
import React from "react";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx("sy-card shadow-soft", className)}>{children}</div>;
}

export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx("sy-panel shadow-soft", className)}>{children}</div>;
}

export function Button({
  variant = "ghost",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "ghost" | "primary" }) {
  return (
    <button
      {...props}
      className={clsx(
        variant === "primary" ? "sy-btn-primary" : "sy-btn",
        "text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    />
  );
}

export function Pill({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={clsx("sy-pill transition", active && "sy-pill-active")}>
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx("sy-input w-full text-sm placeholder:text-white/35", props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={clsx("sy-input w-full text-sm placeholder:text-white/35 min-h-[90px] resize-none", props.className)} />;
}
