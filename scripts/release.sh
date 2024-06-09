#!/bin/bash
set -eux

cp -r ./dist ../

ls ../

# Checkout to gh-pages branch
{ git checkout gh-pages; } || { git checkout -b gh-pages; }

# Clear folder
cd ..
rm -rf rmp-designer/*

# Copy artefacts
cp -r dist/* rmp-designer

cd rmp-designer

# Bypass JEKYLL
touch .nojekyll

# Write INFO.JSON
cat >info.json <<EOF
{
  "component": "rmp-designer",
  "version": "$VERSION",
  "environment": "$ENV",
  "instance": "GitHub"
}
EOF

# Push
git add .
git commit -m "Release version $VERSION to $ENV"
git push -u origin gh-pages

git checkout main
