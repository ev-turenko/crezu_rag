/**
 * @swagger
 * /api/files/list:
 *   get:
 *     tags:
 *       - Files
 *     summary: List uploaded files
 *     description: Retrieve list of uploaded files (requires password authentication)
 *     parameters:
 *       - name: password
 *         in: header
 *         description: Password for file access
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Files list retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 files:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       size:
 *                         type: number
 *                       uploadedAt:
 *                         type: string
 *       401:
 *         description: Unauthorized - invalid password
 */

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     tags:
 *       - Files
 *     summary: Upload a file
 *     description: Upload a file to the server (requires password authentication)
 *     parameters:
 *       - name: password
 *         in: header
 *         description: Password for file access
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 fileName:
 *                   type: string
 *       400:
 *         description: Invalid file or request
 *       401:
 *         description: Unauthorized - invalid password
 *       413:
 *         description: File too large
 */

/**
 * @swagger
 * /api/files/download/{fileName}:
 *   get:
 *     tags:
 *       - Files
 *     summary: Download a file
 *     description: Download an uploaded file (requires password authentication)
 *     parameters:
 *       - name: fileName
 *         in: path
 *         required: true
 *         description: Name of the file to download
 *         schema:
 *           type: string
 *       - name: password
 *         in: header
 *         description: Password for file access
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized - invalid password
 *       404:
 *         description: File not found
 */

/**
 * @swagger
 * /api/files/{fileName}:
 *   delete:
 *     tags:
 *       - Files
 *     summary: Delete a file
 *     description: Delete an uploaded file (requires password authentication)
 *     parameters:
 *       - name: fileName
 *         in: path
 *         required: true
 *         description: Name of the file to delete
 *         schema:
 *           type: string
 *       - name: password
 *         in: header
 *         description: Password for file access
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       401:
 *         description: Unauthorized - invalid password
 *       404:
 *         description: File not found
 */
