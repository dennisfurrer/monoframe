export type OrganizationMetadata = {
  region: string;
  tier: "free" | "pro" | "enterprise";
  seats: number;
};

export type OrganizationRecord = {
  id: string;
  name: string;
  slug: string;
  metadata: OrganizationMetadata;
  createdAt: Date;
  updatedAt: Date;
};

export type DataSource = "postgres" | "fixtures";
