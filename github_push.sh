git config --global user.email "mailtodansih@gmail.com"
git config --global user.name
git branch
git status
echo "Enter your comment:"
read comment
branch=$(git branch --show-current)
# echo "\n- Commit($branch): `date` $comment" >> README.md
git add . 
git commit -a -m "Commit: `date` $comment" 
git push
echo "Push Successful `date`" 
git config --global user.email " "