/**
 * @swagger
 * /api/config:
 *   get:
 *     tags:
 *       - Configuration
 *     summary: Get application configuration
 *     description: Retrieve application configuration settings
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

/**
 * @swagger
 * /api/countries:
 *   get:
 *     tags:
 *       - Configuration
 *     summary: Get list of countries
 *     description: Retrieve all supported countries with their codes and IDs
 *     responses:
 *       200:
 *         description: Countries list retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 countries:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 */

/**
 * @swagger
 * /api/localization:
 *   get:
 *     tags:
 *       - Configuration
 *     summary: Get supported languages
 *     description: Retrieve list of supported languages and localization options
 *     responses:
 *       200:
 *         description: Languages list retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 languages:
 *                   type: array
 *                   items:
 *                     type: object
 */

/**
 * @swagger
 * /api/fields/industries:
 *   get:
 *     tags:
 *       - Configuration
 *     summary: Get employment industries
 *     description: Retrieve list of employment industry options
 *     responses:
 *       200:
 *         description: Industries list retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 industries:
 *                   type: array
 *                   items:
 *                     type: object
 */

/**
 * @swagger
 * /api/fields/income-types:
 *   get:
 *     tags:
 *       - Configuration
 *     summary: Get income types
 *     description: Retrieve list of income type options
 *     responses:
 *       200:
 *         description: Income types list retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 incomeTypes:
 *                   type: array
 *                   items:
 *                     type: object
 */

/**
 * @swagger
 * /api/offer:
 *   get:
 *     tags:
 *       - Configuration
 *     summary: Get offers
 *     description: Retrieve available financial offers and products
 *     responses:
 *       200:
 *         description: Offers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 offers:
 *                   type: array
 *                   items:
 *                     type: object
 */

/**
 * @swagger
 * /api/disclaimer:
 *   get:
 *     tags:
 *       - Configuration
 *     summary: Get disclaimer text
 *     description: Retrieve application disclaimer or terms of service
 *     responses:
 *       200:
 *         description: Disclaimer retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 disclaimer:
 *                   type: string
 */

/**
 * @swagger
 * /api/chat-greeting:
 *   get:
 *     tags:
 *       - Configuration
 *     summary: Get chat greeting
 *     description: Retrieve the initial greeting message for new chats
 *     responses:
 *       200:
 *         description: Greeting retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 greeting:
 *                   type: string
 */
