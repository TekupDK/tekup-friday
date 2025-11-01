# Billy Integration (Billy-mcp By Tekup)

## Overview

Friday AI Chat integrates with Billy.dk accounting system via **Billy-mcp By Tekup**, a Model Context Protocol server developed by TekupDK.

## Repository & Version

- **Repository**: https://github.com/TekupDK/tekup-billy
- **Server Name**: Billy-mcp By Tekup
- **Version**: 2.0.0
- **Base URL**: https://tekup-billy-production.up.railway.app
- **User-Agent**: Billy-mcp-By-Tekup/2.0
- **Documentation**: docs/integration/CHATGPT_INTEGRATION_GUIDE.md

## What is Billy-mcp By Tekup?

Billy-mcp By Tekup is a standardized MCP (Model Context Protocol) server that provides a clean interface to Billy.dk's accounting API. It handles:

- **Invoice Management**: Create, list, update invoices with automatic pagination
- **Customer/Contact Management**: Search and manage Billy contacts
- **Product Catalog**: Access product database
- **Payment Tracking**: Monitor invoice payment status
- **Draft Invoice Creation**: Generate invoice drafts for review

## v2.0.0 Features

### Enhanced Pagination
All list operations now use automatic pagination:
- Fetches all pages automatically (max 100 pages = 100,000 items)
- Default limit: 20 items per API response
- Returns pagination metadata with each response

### API Endpoints

```
POST /api/v1/tools/list_invoices
POST /api/v1/tools/list_customers  
POST /api/v1/tools/list_products
POST /api/v1/tools/create_invoice
```

### Response Format

```json
{
  "success": true,
  "invoices": [...],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "returned": 20,
    "hasMore": true
  }
}
```

## Integration in Friday

### Backend (`server/billy.ts`)

The Billy client uses environment variables for authentication:

```typescript
BILLY_API_KEY=your_api_key
BILLY_ORGANIZATION_ID=your_org_id
```

### Frontend (`client/src/components/inbox/InvoicesTab.tsx`)

The Invoices tab displays Billy invoices via tRPC:

```typescript
const { data: invoices } = trpc.inbox.invoices.list.useQuery();
```

### Available Endpoints

1. **List Invoices**: `trpc.inbox.invoices.list.useQuery()`
   - Returns all invoices with automatic pagination
   - Includes pagination metadata

2. **Create Invoice**: `trpc.inbox.invoices.create.useMutation()`
   - Creates draft invoice in Billy.dk
   - Requires contactId, entryDate, lines

## API Documentation

- **Billy.dk API**: https://www.billy.dk/api
- **Billy-mcp By Tekup**: https://github.com/TekupDK/tekup-billy
- **Integration Guide**: docs/integration/CHATGPT_INTEGRATION_GUIDE.md

## Environment Setup

Add to your `.env` or Manus Secrets:

```bash
BILLY_API_KEY=your_billy_api_key
BILLY_ORGANIZATION_ID=your_billy_organization_id
```

## Features Implemented

- ✅ Invoice listing with automatic pagination
- ✅ Invoice creation (draft mode)
- ✅ Customer search by email
- ✅ Invoice display in Friday UI
- 🚧 Invoice search and filter (in progress)
- 🚧 AI invoice analysis (in progress)

## Future Enhancements

- Real-time invoice sync via webhooks
- Payment status tracking with notifications
- Customer autocomplete from Billy contacts
- Automated invoice generation from completed jobs
- Bulk invoice operations
- Invoice PDF download and preview
