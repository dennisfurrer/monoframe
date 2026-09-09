import { cacheLife, cacheTag } from "next/cache";
import { findOrganization, listOrganizations } from "./source";
import type { OrganizationRecord } from "./types";

export const DIRECTORY_TAG = "organizations";

export function organizationTag(slug: string): string {
  return `organization:${slug}`;
}

export async function getDirectory(): Promise<OrganizationRecord[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(DIRECTORY_TAG);

  return listOrganizations();
}

export async function getOrganization(
  slug: string,
): Promise<OrganizationRecord | null> {
  "use cache";
  cacheLife("days");
  cacheTag(DIRECTORY_TAG);
  cacheTag(organizationTag(slug));

  return findOrganization(slug);
}
