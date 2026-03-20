import { Request, Response } from 'express';

export const getChatGreeting = (_: Request, res: Response) => {
    res.status(200).json(null);
};
