import { Request, Response } from 'express';


export const healthcheck = (_: Request, res: Response) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        message: 'Service is healthy and running'
    });
};