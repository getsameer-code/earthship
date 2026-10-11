"use client";

export default function ConfirmButton({
  message,
  className,
  children,
  formAction,
}: {
  message: string;
  className?: string;
  children: React.ReactNode;
  formAction: () => Promise<void>;
}) {
  return (
    <button
      type="submit"
      formNoValidate
      formAction={formAction}
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
