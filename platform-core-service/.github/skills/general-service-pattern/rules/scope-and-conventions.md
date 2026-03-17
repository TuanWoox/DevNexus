# Scope And Conventions

## Scope

Apply this pattern to:
- controllers
- service methods
- repository calls
- response contracts
- auth and ownership validation
- paging and bulk delete endpoints

## Fixed Conventions

1. Service methods return typed ReturnResult<T>.
2. Controllers always return Ok(returnResult).
3. Controllers are thin; business rules stay in services.
4. Each endpoint and service method uses try-catch and logs exception messages.
5. Ownership checks are performed in service before read/update/delete/delete-many when resources are user-bound.
6. Bulk delete must validate ownership for all requested IDs before repository deletion.
7. Use concrete types in ReturnResult<T>; avoid ReturnResult<object> when a specific type exists.

## Layer Responsibilities

Controller layer:
- map HTTP endpoint to service call
- initialize typed ReturnResult<T>
- catch unexpected exceptions
- return Ok(returnResult)

Service layer:
- validate input DTO and IDs
- validate authentication context
- validate ownership and business rules
- call repository methods
- map entities to DTOs

Repository layer:
- generic persistence operations
- no user-specific ownership logic
