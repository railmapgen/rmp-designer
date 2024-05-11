#!/bin/bash
set -eux

cp -r ./dist ../

ls ../

# Checkout to gh-pages branch
{ git checkout gh-pages; } || { git checkout -b gh-pages; }

# Clear folder
cd ..
rm -rf rmp-style-generator/*

# Copy artefacts
cp -r dist/* rmp-style-generator

cd rmp-style-generator

# Bypass JEKYLL
touch .nojekyll

# Write INFO.JSON
cat >info.json <<EOF
{
  "component": "rmp-style-generator",
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
