#!/bin/bash

echo "🧹 Starting Docker cleanup..."

# Remove stopped containers
echo "Removing stopped containers..."
docker container prune -f

# Remove dangling images
echo "Removing dangling images..."
docker image prune -f

# Remove unused networks
echo "Removing unused networks..."
docker network prune -f

# Remove unused volumes (be careful with this one)
echo "Removing unused volumes..."
docker volume prune -f

# Show disk usage after cleanup
echo "📊 Current Docker disk usage:"
docker system df

echo "✅ Docker cleanup completed!"