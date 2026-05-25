/**
 * @swagger
 * /api/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check
 *     description: Check if the API server is running and healthy
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: ['ok', 'healthy']
 */

/**
 * @swagger
 * /api/health/mongo:
 *   get:
 *     tags:
 *       - Health
 *     summary: MongoDB health check
 *     description: Check if MongoDB database connection is healthy
 *     responses:
 *       200:
 *         description: MongoDB is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: ['ok', 'healthy']
 */

/**
 * @swagger
 * /api/profile/data:
 *   post:
 *     tags:
 *       - User Management
 *     summary: Get user profile data
 *     description: Retrieve user profile information
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Profile data retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

/**
 * @swagger
 * /api/search:
 *   get:
 *     tags:
 *       - Search
 *     summary: Search
 *     description: Perform a search query (GET method)
 *     parameters:
 *       - name: q
 *         in: query
 *         description: Search query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results retrieved
 *   post:
 *     tags:
 *       - Search
 *     summary: Search with body
 *     description: Perform a search query (POST method)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               q:
 *                 type: string
 *     responses:
 *       200:
 *         description: Search results retrieved
 */

/**
 * @swagger
 * /api/client-id:
 *   get:
 *     tags:
 *       - User Management
 *     summary: Get client ID
 *     description: Get or create a client ID based on cookie UUID
 *     responses:
 *       200:
 *         description: Client ID retrieved or created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clientId:
 *                   type: string
 */

/**
 * @swagger
 * /api/attribution:
 *   post:
 *     tags:
 *       - User Management
 *     summary: Save attribution data
 *     description: Save user attribution or tracking data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Attribution data saved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 */

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     tags:
 *       - User Management
 *     summary: Save notification preferences
 *     description: Save user notification preferences or settings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Notification preferences saved
 */

/**
 * @swagger
 * /api/account-deletion/request:
 *   post:
 *     tags:
 *       - User Management
 *     summary: Request account deletion
 *     description: Request deletion of user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Account deletion request submitted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 */

/**
 * @swagger
 * /api/trial/status:
 *   get:
 *     tags:
 *       - User Management
 *     summary: Get trial status
 *     description: Check the current user's trial status (requires authentication)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Trial status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isTrialActive:
 *                   type: boolean
 *                 daysRemaining:
 *                   type: number
 */

/**
 * @swagger
 * /api/trial/eligible:
 *   get:
 *     tags:
 *       - User Management
 *     summary: Check trial eligibility
 *     description: Check if user is eligible for trial (requires authentication)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Eligibility status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 eligible:
 *                   type: boolean
 */

/**
 * @swagger
 * /api/trial/accept:
 *   post:
 *     tags:
 *       - User Management
 *     summary: Accept trial offer
 *     description: Accept and activate trial for the user (requires authentication)
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
 *         description: Trial accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 */

/**
 * @swagger
 * /api/view/chat/{chat_id}:
 *   get:
 *     tags:
 *       - User Management
 *     summary: View shared chat
 *     description: View a publicly shared chat
 *     parameters:
 *       - name: chat_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat retrieved
 *       404:
 *         description: Chat not found
 */

/**
 * @swagger
 * /api/view/chat/{chat_id}/pdf:
 *   get:
 *     tags:
 *       - User Management
 *     summary: Download chat as PDF
 *     description: Download a shared chat as PDF document
 *     parameters:
 *       - name: chat_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF generated and ready to download
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Chat not found
 */

/**
 * @swagger
 * /api/test/reg-form/check-hashes:
 *   get:
 *     tags:
 *       - Search
 *     summary: Check registration form hashes
 *     description: Validate registration form integrity using hashes
 *     parameters:
 *       - name: formId
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Form hash validation result
 */

/**
 * @swagger
 * /api/geoip:
 *   get:
 *     tags:
 *       - Configuration
 *     summary: GeoIP information
 *     description: Get geographic location information based on IP address
 *     responses:
 *       200:
 *         description: Geographic location retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
