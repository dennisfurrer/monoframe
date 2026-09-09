"use server";

import { updateTag } from "next/cache";
import { DIRECTORY_TAG, organizationTag } from "./data/organizations";
import { dataSource, renameOrganization } from "./data/source";

export type RenameState = {
  status: "idle" | "error" | "success";
  message: string;
};

export const initialRenameState: RenameState = { status: "idle", message: "" };

export async function renameOrganizationAction(
  _previous: RenameState,
  formData: FormData,
): Promise<RenameState> {
  const slugValue = formData.get("slug");
  const nameValue = formData.get("name");
  const slug = typeof slugValue === "string" ? slugValue : "";
  const name = typeof nameValue === "string" ? nameValue.trim() : "";

  if (name.length < 2) {
    return { status: "error", message: "Name needs at least two characters." };
  }

  if (dataSource() === "fixtures") {
    return {
      status: "error",
      message: "Fixture mode is read only. Set DATABASE_URL to enable writes.",
    };
  }

  await renameOrganization(slug, name);

  // updateTag expires and refreshes in the same request, so the response the
  // user gets back already contains the new name.
  updateTag(DIRECTORY_TAG);
  updateTag(organizationTag(slug));

  return {
    status: "success",
    message: "Renamed and refreshed in one request.",
  };
}
