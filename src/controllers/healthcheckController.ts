import { Request, Response } from 'express';
import { MongoClient } from 'mongodb';


export const healthcheck = (_: Request, res: Response) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime().toFixed(2),
        message: 'Service is healthy and running now'
    });
};

const buildMongoUri = (): string => {
    if (process.env.MONGODB_URI) {
        return process.env.MONGODB_URI;
    }

    const username = process.env.MONGODB_INITDB_ROOT_USERNAME || '';
    const password = process.env.MONGODB_INITDB_ROOT_PASSWORD || '';
    const host = process.env.MONGODB_HOST || 'mongodb';
    const port = process.env.MONGODB_PORT || '27017';

    if (username && password) {
        return `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/admin?authSource=admin`;
    }

    return `mongodb://${host}:${port}`;
};

export const mongoHealthcheck = async (_: Request, res: Response) => {
    const uri = buildMongoUri();
    const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
    });

    try {
        await client.connect();
        await client.db('admin').command({ ping: 1 });

        return res.status(200).json({
            status: 'OK',
            service: 'mongodb',
            timestamp: new Date().toISOString(),
            message: 'MongoDB connection successful'
        });
    } catch (error) {
        return res.status(500).json({
            status: 'ERROR',
            service: 'mongodb',
            timestamp: new Date().toISOString(),
            message: 'MongoDB connection failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    } finally {
        await client.close();
    }
};