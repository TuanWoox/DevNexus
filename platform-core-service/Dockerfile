# Build stage - .NET SDK 9.0
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build

WORKDIR /app

# Copy project files first (layer caching optimization)
# Preserve the folder structure inside /app/platform-core-service/
COPY platform-core-service/platform-core-service.sln ./platform-core-service/
COPY platform-core-service/platform-core-service/platform-core-service.csproj ./platform-core-service/platform-core-service/
COPY platform-core-service/platform-core-service.Business/platform-core-service.Business.csproj ./platform-core-service/platform-core-service.Business/
COPY platform-core-service/platform-core-service.Common/platform-core-service.Common.csproj ./platform-core-service/platform-core-service.Common/
COPY platform-core-service/platform-core-service.Data/platform-core-service.Data.csproj ./platform-core-service/platform-core-service.Data/

# Restore NuGet packages (caches this layer)
RUN dotnet restore platform-core-service/platform-core-service.sln

# Copy the rest of the source code
COPY platform-core-service ./platform-core-service/

# Publish
RUN dotnet publish platform-core-service/platform-core-service.sln -c Release -o /app/out


# Runtime stage - lightweight ASP.NET runtime only
FROM mcr.microsoft.com/dotnet/aspnet:9.0

WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy published output from build stage
COPY --from=build /app/out .

# Configure ASP.NET Core port
ENV ASPNETCORE_URLS=http://+:8080

# Start application
ENTRYPOINT ["dotnet", "platform-core-service.dll"]
