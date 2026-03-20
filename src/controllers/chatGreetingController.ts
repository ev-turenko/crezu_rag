import { Request, Response } from 'express';

export const getChatGreeting = (_: Request, res: Response) => {
    res.status(200).json({
        "welcome_message": "ABC",
        "features": [
            "123",
            "456"
        ],
        "anon_welcome_message": "You're in private mode now",
        "anon_features": [
            "AI assistant won't remember this conversation. It will be deleted automatically once you close the chat."
        ]
    });
};
