# API Contracts And Checklist

## CRUD Endpoint Set

Use these endpoint conventions for consistency:
- POST create
- GET {id}
- POST my-resources
- PUT update
- DELETE {id}
- POST deletemany

## Type Matching Rules

Controller return variable generic type must match service return type exactly.

Examples:
- CreateAsync -> ReturnResult<ResourceDTO>
- GetMyResourcesAsync -> ReturnResult<PagedData<ResourceDTO, string>>
- DeleteAsync -> ReturnResult<bool>
- DeleteManyAsync -> ReturnResult<int>

Never use ReturnResult<object> if a concrete type exists.

## Error Message Guidance

Use clear, consistent messages:
- User not authenticated
- Invalid resource ID
- Resource {id} not found
- Access denied: You do not own this resource

## Implementation Checklist

- Interface added or updated in Common/Contracts layer
- Service implementation added or updated in Business/Application layer
- Controller endpoints added or updated in API layer
- DI registration added
- AutoMapper profile updated
- Typed ReturnResult<T> used end-to-end
- Ownership validation implemented for user-scoped resources
- Bulk delete ownership validation implemented before repository call
- Build passes and endpoint smoke tests run

## Adaptation Notes

For non-user-owned resources:
- remove ownership checks
- keep input validation, existence checks, and typed ReturnResult<T>

For read-only modules:
- keep thin controller + typed service return
- omit create/update/delete endpoints

For domain-specific uniqueness rules:
- validate in service before create/update
- return explicit validation message
