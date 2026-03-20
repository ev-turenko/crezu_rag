import type { Request, Response } from 'express';
import z from 'zod';

const notificationsSchema = z.object({
  client_id: z.string().trim().min(1),
  push_enabled: z.boolean(),
});

export const saveNotifications = (req: Request, res: Response) => {
  const parsed = notificationsSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
    return;
  }

  const uuid = req.cookies?.uuid ?? null;

  void uuid

  res.status(200).json({ success: true });
};
