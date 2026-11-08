export function ToothLogo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <div className={`${className} flex items-center justify-center rounded-xl bg-primary`}>
      <svg viewBox="0 0 24 24" className="h-3/5 w-3/5 fill-primary-foreground">
        <path d="M12 3.5c-1.6-1-3.6-1.5-5.3-.9C4.4 3.4 3.3 5.8 3.7 8.6c.3 2 1.1 3.4 1.6 5.4.5 2 .6 4.6 1.6 6.3.6 1 1.8 1 2.3-.1.8-1.7 1-4.6 2.8-4.6s2 2.9 2.8 4.6c.5 1.1 1.7 1.1 2.3.1 1-1.7 1.1-4.3 1.6-6.3.5-2 1.3-3.4 1.6-5.4.4-2.8-.7-5.2-3-6-1.7-.6-3.7-.1-5.3.9z" />
      </svg>
    </div>
  );
}
