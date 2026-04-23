# =============================================
# STAGE 1 - BUILD
# Use the full .NET SDK image to build the app
# AS build-env gives this stage a name so we can reference it later
# =============================================
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build-env

# Set the working directory inside the container
# All following commands run from this folder
WORKDIR /app 

# Copy project files first (layer caching optimization)
COPY background-job-worker/background-job-worker.sln ./background-job-worker/
COPY background-job-worker/background-job-worker/background-job-worker.csproj ./background-job-worker/background-job-worker/
COPY platform-core-service/platform-core-service.Common/platform-core-service.Common.csproj ./platform-core-service/platform-core-service.Common/
COPY platform-core-service/platform-core-service.Business/platform-core-service.Business.csproj ./platform-core-service/platform-core-service.Business/
COPY platform-core-service/platform-core-service.Data/platform-core-service.Data.csproj ./platform-core-service/platform-core-service.Data/

# Restore NuGet packages
RUN cd background-job-worker && dotnet restore background-job-worker.sln

# Copy the rest of the source code
COPY background-job-worker ./background-job-worker/
COPY platform-core-service ./platform-core-service/

# Build and publish the app in Release mode
RUN cd background-job-worker && dotnet publish background-job-worker.sln -c Release -o /app/out

# =============================================
# STAGE 2 - RUNTIME
# Use the smaller ASP.NET runtime image (no build tools)
# This keeps the final image lean
# =============================================
FROM mcr.microsoft.com/dotnet/aspnet:9.0 

# Set working directory for the runtime container
WORKDIR /app

# Copy only the published output from Stage 1 (build-env)
# We don't copy source code or build tools — just the compiled app
COPY --from=build-env /app/out .  

# Configure ASP.NET Core port
ENV ASPNETCORE_URLS=http://+:8081

# ENTRYPOINT = the fixed command that always runs when container starts
# This container's sole job is to run PlatformService.dll — it never changes
ENTRYPOINT [ "dotnet", "background-job-worker.dll" ]