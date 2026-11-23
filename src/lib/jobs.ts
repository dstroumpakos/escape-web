/** Job ads: the same lists as convex/jobs.ts (JOB_ROLES, JOB_GENDERS, JOB_EMPLOYMENT). */
export const JOB_ROLES = ['gm', 'actor', 'host', 'technician', 'other'] as const;
export const JOB_GENDERS = ['male', 'female'] as const;
export const JOB_EMPLOYMENT = ['full', 'part', 'freelance', 'seasonal'] as const;

export type JobRole = (typeof JOB_ROLES)[number];

/** What /jobs and the company profile get from jobs:listOpen / jobs:byCompany. */
export type PublicJob = {
  _id: string;
  title: string;
  description: string;
  roles: string[];
  genders: string[];
  employment: string;
  city: string;
  contactEmail: string;
  contactPhone: string;
  createdAt: number;
  company: { _id: string; name: string; logo: string; city: string };
};
