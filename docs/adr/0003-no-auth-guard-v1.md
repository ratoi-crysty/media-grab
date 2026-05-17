---
status: accepted
---

# No AuthGuard in v1

The project's NestJS conventions (see `skills:nestjs`) mandate a global `AuthGuard` registered via `APP_GUARD`, with routes opting out via `@PublicApi()`. v1 of Media Grab deliberately ships without it because the app is a local single-user tool (ADR-0001 context, no networked multi-user surface). Reintroducing the guard means importing it from the shared auth lib, registering it in `AppModule`, and either tagging every existing route `@PublicApi()` or wiring a real session — neither is justified by v1 scope.

## Consequences

- All download routes are unauthenticated; `request.user` is never populated. Code must not assume it exists.
- Future multi-user mode will need a single, mechanical retrofit (register `APP_GUARD`, decide per-route public/protected). Acceptable cost.
- Other NestJS skill rules (TypeORM, shared model interface in NX common lib, Swagger decorators everywhere) still apply — this ADR scopes only to auth.
