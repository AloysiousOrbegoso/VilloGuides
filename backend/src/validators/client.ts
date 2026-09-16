import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().trim().min(1, "Add the client's name."),
  subdomain: z.string().trim().min(1),
  type: z.enum(["company", "individual"]),
});

export const updateClientSchema = z.object({
  name: z.string().trim().min(1).optional(),
  subdomain: z.string().trim().min(1).optional(),
  type: z.enum(["company", "individual"]).optional(),
  dashboard_addon_paid: z.union([z.literal(0), z.literal(1)]).optional(),
  access_aud: z.string().nullable().optional(),
  brand_color: z.string().nullable().optional(),
});

export const addClientUserSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
  role: z.enum(["admin", "support"]),
});
