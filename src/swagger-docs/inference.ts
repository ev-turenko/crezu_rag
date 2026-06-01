/**
 * @swagger
 * /api/ai/message:
 *   post:
 *     tags:
 *       - AI Inference
 *     summary: Send a message to the AI assistant
 *     description: Process a user message and get AI response with safety checks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InferenceRequest'
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 chat_id:
 *                   type: string
 *                 messages:
 *                   type: array
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/ai/message/stream:
 *   post:
 *     tags:
 *       - AI Inference
 *     summary: Stream AI assistant response
 *     description: Get streamed response from AI assistant with real-time updates
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InferenceRequest'
 *     responses:
 *       200:
 *         description: Streaming response
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/ai/chats:
 *   post:
 *     tags:
 *       - AI Inference
 *     summary: Get all chats
 *     description: Retrieve list of all chats
 *     responses:
 *       200:
 *         description: List of chats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 chats:
 *                   type: array
 */

/**
 * @swagger
 * /api/ai/client/{client_id}/chats:
 *   get:
 *     tags:
 *       - AI Inference
 *     summary: Get chats for a specific client
 *     description: Retrieve all chats belonging to a client (requires authentication)
 *     parameters:
 *       - name: client_id
 *         in: path
 *         required: true
 *         description: The client ID
 *         schema:
 *           type: string
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of client chats
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client not found
 *   post:
 *     tags:
 *       - AI Inference
 *     summary: Create or update chats for a client
 *     description: Create new chats or update existing ones for a client (requires authentication)
 *     parameters:
 *       - name: client_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Operation successful
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client not found
 */

/**
 * @swagger
 * /api/ai/client/{client_id}/chats/{chat_id}:
 *   delete:
 *     tags:
 *       - AI Inference
 *     summary: Delete a specific chat
 *     description: Delete a chat belonging to a client (requires authentication)
 *     parameters:
 *       - name: client_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: chat_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Chat deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       400:
 *         description: Missing chat_id parameter
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Chat not found
 */

/**
 * @swagger
 * /api/ai/history:
 *   post:
 *     tags:
 *       - AI Inference
 *     summary: Get chat history
 *     description: Retrieve chat history for pagination
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chat_id:
 *                 type: string
 *               limit:
 *                 type: number
 *               offset:
 *                 type: number
 *     responses:
 *       200:
 *         description: Chat history retrieved
 */

/**
 * @swagger
 * /api/ai/history/infinite:
 *   post:
 *     tags:
 *       - AI Inference
 *     summary: Get infinite scroll chat history
 *     description: Retrieve chat history with infinite scroll pagination
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Chat history retrieved
 */

/**
 * @swagger
 * /api/ai/suggestions:
 *   post:
 *     tags:
 *       - AI Inference
 *     summary: Get chat suggestions
 *     description: Get localized chat suggestions based on the requested language, falling back to country
 *     parameters:
 *       - name: lang
 *         in: query
 *         description: Language code (optional). Use ru to request Russian suggestions for any country.
 *         schema:
 *           type: string
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
 *                     type: number
 *     responses:
 *       200:
 *         description: Suggestions retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Suggestion'
 */

/**
 * @swagger
 * /api/ai/report:
 *   post:
 *     tags:
 *       - AI Inference
 *     summary: Report a message
 *     description: Report inappropriate messages from the AI
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Report submitted
 */

/**
 * @swagger
 * /api/ai/offers/report:
 *   post:
 *     tags:
 *       - AI Inference
 *     summary: Report an offer
 *     description: Report inappropriate offers presented to user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Offer report submitted
 */

/**
 * @swagger
 * /api/ai/chats/share/{chat_id}:
 *   post:
 *     tags:
 *       - AI Inference
 *     summary: Share a chat
 *     description: Generate a shareable link for a chat
 *     parameters:
 *       - name: chat_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Chat shared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 shareUrl:
 *                   type: string
 */
