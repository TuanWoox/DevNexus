# ReturnResult Rules

Success shape:

```json
{
  "result": {},
  "message": null
}
```

Failure shape:

```json
{
  "result": null,
  "message": "Error message"
}
```

Rules:
- set Result on success
- set Message on failure
