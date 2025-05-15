@echo off
echo Starting MongoDB container...
docker-compose up -d mongodb
echo MongoDB container started.
echo You can now run your application with: npm run dev 