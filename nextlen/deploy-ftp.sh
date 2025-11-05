#!/bin/bash

# FTP credentials
FTP_USER="f017cd3a"
FTP_PASS="f5mPnpwnsotcoNraN4zF"
FTP_HOST="w020c360.kasserver.com"
FTP_DIR="/"

# Build project
echo "Building project..."
npm run build:prod || npm run build

# Copy .htaccess to dist
if [ -f .htaccess ]; then
  cp .htaccess dist/
  echo ".htaccess copied to dist"
fi

# Upload to FTP
echo "Uploading files to FTP..."
lftp -u "$FTP_USER,$FTP_PASS" "$FTP_HOST" << EOF
cd $FTP_DIR
mirror -R dist/ .
quit
EOF

echo "Deployment completed!"
