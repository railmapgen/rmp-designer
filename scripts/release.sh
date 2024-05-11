set -eux

ls ./
ls ../

exit 0

# Checkout to gh-pages branch
{ git checkout gh-pages; } || { git checkout -b gh-pages; }

# Clear folder
cd ..
rm -rf rmp-style-generator/*

# Copy artefacts
cp -r dist/* GITHUB_TARGET

# Bypass JEKYLL
touch GITHUB_TARGET/.nojekyll

# Write INFO.JSON
cat >GITHUB_TARGET/info.json <<EOF
{
  "component": "rmp-style-generator",
  "version": "$VERSION",
  "environment": "$ENV",
  "instance": "GitHub"
}
EOF

# Push
cd rmp-style-generator
git add .
git commit -m "Release version $VERSION to $ENV"
git push -u origin gh-pages

git checkout main
