set -e

APP_DIR="/home/ubuntu/app"
GITHUB_REPO="CS222-UIUC/fa25-team118-titans"
BRANCH="main"

cd $APP_DIR
if [ -d "titans" ]; then
    cd titans
    git pull origin $BRANCH
else
    git clone https://github.com/$GITHUB_REPO.git titans
    cd titans
fi

docker-compose down || true
docker-compose build --no-cache
docker-compose up -d

echo "Deployment complete! Application should be running at http://localhost:3000"