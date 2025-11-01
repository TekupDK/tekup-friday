# Billy Integration (billy-mcp by TekupDK)

## Overview

Friday AI Chat integrates with Billy.dk accounting system via **billy-mcp**, a Model Context Protocol server developed by TekupDK.

## Repository

- **billy-mcp**: https://github.com/TekupDK/tekup-billy
- **Official Name**: billy-mcp By Tekup

## What is billy-mcp?

billy-mcp is a standardized MCP (Model Context Protocol) server that provides a clean interface to Billy.dk's accounting API. It handles:

- Invoice management (create, list, update)
- Customer/contact management
- Product catalog
- Payment tracking
- Draft invoice creation

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
2. **Create Invoice**: `trpc.inbox.invoices.create.useMutation()`

## API Documentation

- Billy.dk API: https://www.billy.dk/api
- billy-mcp: https://github.com/TekupDK/tekup-billy

## Environment Setup

Add to your `.env` or Manus Secrets:

```bash
BILLY_API_KEY=your_billy_api_key
BILLY_ORGANIZATION_ID=your_billy_organization_id
```

## Future Enhancements

- Real-time invoice sync
- Payment status tracking
- Customer autocomplete from Billy contacts
- Automated invoice generation from completed jobs
