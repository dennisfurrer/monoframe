"use client";

import { Badge, Input, Spinner, Skeleton, Label } from "@monoframe/ui-atoms";
import { Card, FormField, EmptyState } from "@monoframe/ui-molecules";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-text-primary">Monoframe</h1>
        <p className="mt-1 text-text-secondary">
          Production monorepo skeleton.
        </p>
      </div>

      <p className="text-sm text-text-muted">
        Examples below show integrated packages
      </p>

      <div className="grid w-full max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
        {/* UI Atoms */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            ui-atoms
          </h2>
          <Card variant="bordered" padding="md">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="success" size="md">
                  Active
                </Badge>
                <Badge variant="danger" size="sm">
                  Error
                </Badge>
                <Badge variant="warning" size="sm">
                  Pending
                </Badge>
                <Badge variant="info" size="sm">
                  Info
                </Badge>
                <Badge variant="neutral" size="sm">
                  Draft
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <Label size="sm">Loading</Label>
                <Spinner size="sm" />
                <Spinner size="md" />
              </div>
              <Input type="text" size="md" placeholder="Type something..." />
              <Input
                type="text"
                size="sm"
                placeholder="With error"
                error="This field is required"
              />
              <div className="flex gap-2">
                <Skeleton width="100%" height={20} rounded="md" />
                <Skeleton width={40} height={20} rounded="full" />
              </div>
            </div>
          </Card>
        </section>

        {/* UI Molecules */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            ui-molecules
          </h2>
          <Card variant="elevated" padding="md">
            <FormField
              label="Email address"
              required
              hint="We'll never share your email."
            >
              <Input type="email" size="md" placeholder="you@company.com" />
            </FormField>
          </Card>
          <Card variant="bordered" padding="none">
            <EmptyState
              title="No items yet"
              description="Create your first item to get started."
              action={{ label: "Example CTA", onClick: () => undefined }}
            />
          </Card>
        </section>
      </div>
    </main>
  );
}
