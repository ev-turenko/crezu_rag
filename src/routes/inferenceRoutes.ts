import { Router } from 'express';
import { processRequest, getHistory, getAllChats, reportMessage, getSuggestions } from '../controllers/InferenceController.js';

const router = Router();

/**
 * @swagger
 * /api/ai/message:
 *   post:
 *     summary: Process a chat message
 *     description: Sends a message to the AI and gets a response
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               client_id:
 *                 type: string
 *               chat_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful response
 *       500:
 *         description: Server error
 */
router.post('/message', processRequest);

/**
 * @swagger
 * /api/ai/chats:
 *   post:
 *     summary: Get all chats for a client
 *     description: Retrieves all chat sessions for a specific client
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               client_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: List of chats
 *       500:
 *         description: Server error
 */
router.post('/chats', getAllChats);

/**
 * @swagger
 * /api/ai/history:
 *   post:
 *     summary: Get chat history
 *     description: Retrieves the history of a specific chat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chat_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Chat history
 *       500:
 *         description: Server error
 */
router.post('/history', getHistory);

/**
 * @swagger
 * /api/ai/report:
 *   post:
 *     summary: Report a message
 *     description: Reports a message for moderation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message_id:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Report submitted
 *       500:
 *         description: Server error
 */
router.post('/report', reportMessage);

/**
 * @swagger
 * /api/ai/suggestions:
 *   post:
 *     summary: Get suggestions
 *     description: Retrieves AI-generated suggestions
 *     parameters:
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *         description: Language code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               params:
 *                 type: object
 *                 properties:
 *                   country:
 *                     type: integer
 *     responses:
 *       200:
 *         description: List of suggestions
 *       500:
 *         description: Server error
 */
router.post('/suggestions', getSuggestions);


export default router;
