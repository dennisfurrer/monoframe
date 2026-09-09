"use client";

import { useActionState } from "react";
import { Button, Input } from "@monoframe/ui-atoms";
import { FormField } from "@monoframe/ui-molecules";
import { initialRenameState, renameOrganizationAction } from "@/lib/actions";

export type RenameFormProps = {
  slug: string;
  name: string;
};

export function RenameForm({ slug, name }: RenameFormProps) {
  const [state, formAction, pending] = useActionState(
    renameOrganizationAction,
    initialRenameState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="slug" value={slug} />
      <FormField
        label="Organization name"
        htmlFor="name"
        error={state.status === "error" ? state.message : undefined}
        hint={
          state.status === "success"
            ? state.message
            : "Writes through Prisma, then calls updateTag for read your writes."
        }
      >
        <Input
          id="name"
          name="name"
          type="text"
          size="md"
          defaultValue={name}
        />
      </FormField>
      <div>
        <Button variant="primary" size="md" type="submit" loading={pending}>
          Rename
        </Button>
      </div>
    </form>
  );
}
