@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ================================
echo  Generating posts from source/
echo ================================
call npm run gen
if errorlevel 1 goto fail

echo.
echo ================================
echo  Committing and pushing...
echo ================================
git add -A
git commit -m "Publish: %DATE% %TIME%"
git push
if errorlevel 1 goto fail

echo.
echo ================================
echo  Done! GitHub will deploy in ~2 minutes.
echo  Site: https://OutisNemosseus.github.io/VitePress/
echo ================================
goto end

:fail
echo.
echo *** Something went wrong. Read the messages above. ***

:end
echo.
pause
