#!/bin/bash
cd /app/src/backend
dotnet new sln -n ContractIQ --force
find . -name "*.csproj" -exec dotnet sln ContractIQ.sln add {} \;
