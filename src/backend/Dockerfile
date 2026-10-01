# Multi-stage, non-root Dockerfile for all .NET API services.
# Build context: src/backend/ (the solution root)
# ARG SERVICE sets which project to publish.

ARG SERVICE=Contracts/ContractIQ.Contracts.Api

FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src

# Copy solution + all csproj files first for layer caching
COPY ContractIQ.sln .
COPY SharedKernel/ContractIQ.SharedKernel/ContractIQ.SharedKernel.csproj SharedKernel/ContractIQ.SharedKernel/
COPY SharedKernel/ContractIQ.SharedKernel.Infrastructure/ContractIQ.SharedKernel.Infrastructure.csproj SharedKernel/ContractIQ.SharedKernel.Infrastructure/
COPY Contracts/ContractIQ.Contracts.Domain/ContractIQ.Contracts.Domain.csproj Contracts/ContractIQ.Contracts.Domain/
COPY Contracts/ContractIQ.Contracts.Application/ContractIQ.Contracts.Application.csproj Contracts/ContractIQ.Contracts.Application/
COPY Contracts/ContractIQ.Contracts.Infrastructure/ContractIQ.Contracts.Infrastructure.csproj Contracts/ContractIQ.Contracts.Infrastructure/
COPY Contracts/ContractIQ.Contracts.Api/ContractIQ.Contracts.Api.csproj Contracts/ContractIQ.Contracts.Api/
COPY Workflow/ContractIQ.Workflow.Domain/ContractIQ.Workflow.Domain.csproj Workflow/ContractIQ.Workflow.Domain/
COPY Workflow/ContractIQ.Workflow.Application/ContractIQ.Workflow.Application.csproj Workflow/ContractIQ.Workflow.Application/
COPY Workflow/ContractIQ.Workflow.Infrastructure/ContractIQ.Workflow.Infrastructure.csproj Workflow/ContractIQ.Workflow.Infrastructure/
COPY Workflow/ContractIQ.Workflow.Api/ContractIQ.Workflow.Api.csproj Workflow/ContractIQ.Workflow.Api/
COPY Audit/ContractIQ.Audit.Domain/ContractIQ.Audit.Domain.csproj Audit/ContractIQ.Audit.Domain/
COPY Audit/ContractIQ.Audit.Application/ContractIQ.Audit.Application.csproj Audit/ContractIQ.Audit.Application/
COPY Audit/ContractIQ.Audit.Infrastructure/ContractIQ.Audit.Infrastructure.csproj Audit/ContractIQ.Audit.Infrastructure/
COPY Audit/ContractIQ.Audit.Api/ContractIQ.Audit.Api.csproj Audit/ContractIQ.Audit.Api/
COPY Tenants/ContractIQ.Tenants.Domain/ContractIQ.Tenants.Domain.csproj Tenants/ContractIQ.Tenants.Domain/
COPY Tenants/ContractIQ.Tenants.Application/ContractIQ.Tenants.Application.csproj Tenants/ContractIQ.Tenants.Application/
COPY Tenants/ContractIQ.Tenants.Infrastructure/ContractIQ.Tenants.Infrastructure.csproj Tenants/ContractIQ.Tenants.Infrastructure/
COPY Tenants/ContractIQ.Tenants.Api/ContractIQ.Tenants.Api.csproj Tenants/ContractIQ.Tenants.Api/
COPY Integrations/ContractIQ.Integrations.Domain/ContractIQ.Integrations.Domain.csproj Integrations/ContractIQ.Integrations.Domain/
COPY Integrations/ContractIQ.Integrations.Application/ContractIQ.Integrations.Application.csproj Integrations/ContractIQ.Integrations.Application/
COPY Integrations/ContractIQ.Integrations.Infrastructure/ContractIQ.Integrations.Infrastructure.csproj Integrations/ContractIQ.Integrations.Infrastructure/
COPY Integrations/ContractIQ.Integrations.Api/ContractIQ.Integrations.Api.csproj Integrations/ContractIQ.Integrations.Api/
COPY Gateway/ContractIQ.Gateway.csproj Gateway/
COPY Tests/ContractIQ.Contracts.Tests/ContractIQ.Contracts.Tests.csproj Tests/ContractIQ.Contracts.Tests/

RUN dotnet restore ContractIQ.sln

# Copy all source
COPY . .

ARG SERVICE
RUN dotnet publish ${SERVICE} \
    --configuration Release \
    --no-restore \
    --output /app/publish \
    /p:UseAppHost=false

# Runtime image — non-root
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime
WORKDIR /app

RUN addgroup -S contractiq && adduser -S contractiq -G contractiq
USER contractiq

COPY --from=build --chown=contractiq:contractiq /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# Entrypoint is set via CMD so each service compose entry can override it
# Default: look for the first *.runtimeconfig.json to find the assembly name
ENTRYPOINT ["sh", "-c", "exec dotnet $(ls *.runtimeconfig.json | head -1 | sed 's/.runtimeconfig.json/.dll/')"]
