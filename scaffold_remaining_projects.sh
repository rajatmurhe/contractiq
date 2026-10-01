#!/bin/bash
cd /app/src/backend

PROJECTS=(
  "Workflow/ContractIQ.Workflow.Domain"
  "Workflow/ContractIQ.Workflow.Application"
  "Workflow/ContractIQ.Workflow.Infrastructure"
  "Workflow/ContractIQ.Workflow.Api"
  "Audit/ContractIQ.Audit.Domain"
  "Audit/ContractIQ.Audit.Application"
  "Audit/ContractIQ.Audit.Infrastructure"
  "Audit/ContractIQ.Audit.Api"
  "Integrations/ContractIQ.Integrations.Domain"
  "Integrations/ContractIQ.Integrations.Application"
  "Integrations/ContractIQ.Integrations.Infrastructure"
  "Integrations/ContractIQ.Integrations.Api"
  "Tenants/ContractIQ.Tenants.Domain"
  "Tenants/ContractIQ.Tenants.Application"
  "Tenants/ContractIQ.Tenants.Infrastructure"
  "Tenants/ContractIQ.Tenants.Api"
  "Tests/ContractIQ.Contracts.Tests"
)

for PROJ in "${PROJECTS[@]}"; do
  if [[ "$PROJ" == *Api* ]]; then
    dotnet new webapi -n $(basename $PROJ) -o $PROJ --no-openapi
  elif [[ "$PROJ" == *Tests* ]]; then
    dotnet new xunit -n $(basename $PROJ) -o $PROJ
  else
    dotnet new classlib -n $(basename $PROJ) -o $PROJ
  fi
  dotnet sln ContractIQ.sln add $PROJ/$(basename $PROJ).csproj
done

