# CREZU RAG API - Swagger/OpenAPI Documentation

## Overview

This project now includes comprehensive OpenAPI 3.0.0 (Swagger) documentation. The API documentation is automatically generated and served via an interactive Swagger UI interface.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Project
```bash
npm run build
```

### 3. Launch the Development Server
```bash
npm run dev
```

or for production:
```bash
npm start
```

### 4. Access the API Documentation

Once the server is running, open your browser and navigate to:

**http://localhost:3000/api-docs**

This will open the Swagger UI with full interactive API documentation including:
- All available endpoints
- Request/response schemas
- Example payloads
- Try-it-out functionality to test endpoints directly
- Authentication scheme documentation

### 5. Access the OpenAPI Spec (JSON)
```
http://localhost:3000/api-docs/swagger.json
```

## Files and Structure

### Configuration Files
- **`src/config/swagger.ts`** - Main Swagger configuration using swagger-jsdoc
- **`openapi.yaml`** - Static OpenAPI 3.0.0 specification (for reference)

### Documentation Files
- **`src/swagger-docs/inference.ts`** - AI chat and inference endpoints documentation
- **`src/swagger-docs/configuration.ts`** - Configuration and reference data endpoints
- **`src/swagger-docs/files.ts`** - File management endpoints
- **`src/swagger-docs/health-and-misc.ts`** - Health checks and other endpoints

### Updated Files
- **`src/index.ts`** - Updated to integrate Swagger UI middleware

## API Documentation Highlights

### Main Endpoint Groups

#### 1. **AI Inference** (`/api/ai/*`)
- `POST /api/ai/message` - Send a message to AI assistant
- `POST /api/ai/message/stream` - Stream AI response in real-time
- `GET/POST /api/ai/client/{client_id}/chats` - Manage client chats
- `DELETE /api/ai/client/{client_id}/chats/{chat_id}` - Delete a chat
- `POST /api/ai/suggestions` - Get localized suggestions
- More endpoints for chat history, reporting, and sharing

#### 2. **Configuration** (`/api/*`)
- `/api/config` - App configuration
- `/api/countries` - Supported countries list
- `/api/localization` - Language/localization options
- `/api/fields/industries` - Employment industries
- `/api/fields/income-types` - Income type options
- `/api/offer` - Available financial offers
- `/api/disclaimer` - Terms and disclaimers

#### 3. **Files** (`/api/files/*`)
- `GET /api/files/list` - List uploaded files
- `POST /api/files/upload` - Upload a file
- `GET /api/files/download/{fileName}` - Download a file
- `DELETE /api/files/{fileName}` - Delete a file

#### 4. **User Management**
- `/api/client-id` - Get/create client ID
- `/api/profile/data` - User profile data
- `/api/trial/*` - Trial status and acceptance
- `/api/account-deletion` - Request account deletion
- `/api/notifications` - Notification preferences

#### 5. **Health** (`/api/health/*`)
- `/api/health` - General health check
- `/api/health/mongo` - MongoDB connection status

#### 6. **Search** (`/api/search`)
- `GET/POST /api/search` - Search functionality

## Authentication

Some endpoints require cookie-based authentication:
- Header: `auth` cookie
- Used for client-specific chats, trial status, and account operations

## Customization

### Adding New Endpoints to Documentation

1. Create or edit the appropriate file in `src/swagger-docs/`
2. Use JSDoc-style comments with `@swagger` tags:

```typescript
/**
 * @swagger
 * /api/example:
 *   get:
 *     tags:
 *       - Example Tag
 *     summary: Example endpoint
 *     description: This is an example endpoint
 *     responses:
 *       200:
 *         description: Success response
 */
```

3. Rebuild: `npm run build`
4. Restart the server to see updates

### Modifying Swagger Configuration

Edit `src/config/swagger.ts` to:
- Change server URLs
- Modify title/description
- Add/remove tags
- Update security schemes
- Adjust schemas

## Deployment

When deploying:
1. Update server URLs in `src/config/swagger.ts`
2. Build: `npm run build`
3. Deploy dist folder
4. Documentation will be available at your API endpoint: `https://yourdomain.com/api-docs`

## Technical Stack

- **swagger-ui-express** - Serves the Swagger UI
- **swagger-jsdoc** - Generates OpenAPI spec from JSDoc comments
- **OpenAPI 3.0.0** - API specification standard
- **TypeScript** - Full type safety

## Troubleshooting

### Swagger UI not loading
- Ensure server is running: `npm run dev`
- Check browser console for errors
- Verify port 3000 is accessible

### Endpoints not showing in documentation
- Ensure files in `src/swagger-docs/` are created
- Check `tsconfig.json` includes the files
- Rebuild: `npm run build`

### TypeScript compilation errors
- Install missing types: `npm install --save-dev @types/package-name`
- Clear dist folder: `rm -rf dist`
- Rebuild: `npm run build`

## Resources

- [OpenAPI 3.0.0 Specification](https://spec.openapis.org/oas/v3.0.0)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [swagger-jsdoc Documentation](https://github.com/Surnet/swagger-jsdoc)
