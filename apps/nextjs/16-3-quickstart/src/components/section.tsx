import type { ReactNode } from "react";

export type SectionProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function Section({ title, description, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
        <p className="max-w-2xl text-sm text-text-secondary">{description}</p>
      </div>
      {children}
    </section>
  );
}
