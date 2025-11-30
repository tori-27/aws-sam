# AI Agent Instructions for diplom-sam-app

This is a multi-tenant serverless application built with AWS SAM, TypeScript, and DynamoDB. The application consists of three main services: OrderService, ProductService, and TenantManagementService.

## Architecture Overview

- **Multi-tenant Architecture**: Uses tenant isolation at both data and API levels

  - Each tenant has their own authentication pool (Cognito)
  - API Gateway routes requests based on tenant context
  - DynamoDB tables use tenant-based sharding (`shardId` pattern)

- **Core Services**:
  - `TenantManagementService`: Handles tenant provisioning, registration, and user management
  - `OrderService`: Manages order operations with tenant isolation
  - `ProductService`: Handles product catalog with tenant-specific views

## Key Patterns

### Data Access Pattern

- All database operations go through `BaseRepo<T>` (`src/shared/base-repo.ts`)
- Example usage:

```typescript
class OrderRepo extends BaseRepo<Order> {
  constructor() {
    super("OrderTable", { shardId: string, orderId: string }, fromItem, toItem);
  }
}
```

### Tenant Context

- Tenant information flows through `AuthorizerCtx` interface
- Tenant tiers: PLATINUM, PREMIUM, STANDARD, BASIC
- Each tier has specific rate limits and feature access

### Testing

- Jest for unit tests
- Mock patterns defined in `__mocks__` directories
- Test utils in `src/tests-utils/test-helpers.ts`

## Development Workflow

### Setup

1. Install dependencies:

```bash
npm install
```

2. Build:

```bash
sam build
```

3. Deploy:

```bash
sam deploy --guided  # First time
sam deploy          # Subsequent deploys
```

### Testing

- Run tests: `npm test`
- Run specific service tests: `npm test OrderService`

## Common Operations

### Adding New Tenant Features

1. Update tenant model in `src/TenantManagmentService/tenant-model.ts`
2. Implement feature in service
3. Update tenant provisioning in `tenant-provisioning.ts`
4. Add appropriate test cases

### Database Operations

- Use `BaseRepo` methods: get, scan, put, update, delete
- Always include tenant context in shard keys
- See examples in `*-service-dal.ts` files

## Integration Points

- AWS Cognito for authentication
- DynamoDB for persistence
- API Gateway for request routing
- SSM for parameter management (`src/shared/ssm.ts`)

## Conventions

- Use TypeScript interfaces for all models
- Follow the established service structure:
  - `*-model.ts` - Type definitions
  - `*-service.ts` - Business logic
  - `*-service-dal.ts` - Data access
  - `handlers.ts` - Lambda entry points
