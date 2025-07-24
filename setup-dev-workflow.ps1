# Setup Development Workflow Script
# This script sets up the new branch structure for development and deployment

Write-Host "Setting up Development Workflow..." -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in a git repository
if (!(Test-Path ".git")) {
    Write-Error "This script must be run from the root of the Git repository."
    exit 1
}

# Get current branch
$currentBranch = git branch --show-current
Write-Host "Current branch: $currentBranch" -ForegroundColor Blue

# Create develop branch if it doesn't exist
Write-Host "Setting up branches..." -ForegroundColor Green

$branches = git branch -a
if ($branches -notmatch "develop") {
    Write-Host "  Creating develop branch..." -ForegroundColor Blue
    git checkout -b develop
    git push -u origin develop
} else {
    Write-Host "  develop branch already exists" -ForegroundColor Yellow
}

# Create deploy branch if it doesn't exist
if ($branches -notmatch "deploy") {
    Write-Host "  Creating deploy branch from main..." -ForegroundColor Blue
    git checkout main
    git pull origin main
    git checkout -b deploy
    git push -u origin deploy
} else {
    Write-Host "  deploy branch already exists" -ForegroundColor Yellow
}

# Switch to develop branch
Write-Host "  Switching to develop branch..." -ForegroundColor Blue
git checkout develop

Write-Host ""
Write-Host "Branch Setup Complete!" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your workflow is now:" -ForegroundColor White
Write-Host "  1. Work on 'develop' branch for daily development" -ForegroundColor Green
Write-Host "  2. Merge to 'deploy' branch when ready to deploy" -ForegroundColor Green
Write-Host "  3. Users deploy from 'main' branch via Deploy to Azure button" -ForegroundColor Green
Write-Host ""
Write-Host "Daily workflow:" -ForegroundColor White
Write-Host "  git checkout develop" -ForegroundColor Blue
Write-Host "  # Make your changes..." -ForegroundColor Gray
Write-Host "  git add ." -ForegroundColor Blue
Write-Host "  git commit -m 'Your changes'" -ForegroundColor Blue
Write-Host "  git push origin develop" -ForegroundColor Blue
Write-Host ""
Write-Host "When ready to deploy:" -ForegroundColor White
Write-Host "  git checkout deploy" -ForegroundColor Blue
Write-Host "  git merge develop" -ForegroundColor Blue
Write-Host "  git push origin deploy  # This triggers deployment" -ForegroundColor Blue
Write-Host ""
Write-Host "For releases:" -ForegroundColor White
Write-Host "  git checkout main" -ForegroundColor Blue
Write-Host "  git merge develop" -ForegroundColor Blue
Write-Host "  git tag v1.x.x" -ForegroundColor Blue
Write-Host "  git push origin main --tags" -ForegroundColor Blue
Write-Host ""
Write-Host "You're all set! Happy coding! 🚀" -ForegroundColor Green
