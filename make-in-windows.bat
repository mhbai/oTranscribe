@echo off
@echo.
if [%1]==[] GOTO syntax

:compile_static
REM clear out existing dist folder
rmdir /s /q .\dist
mkdir .\dist

REM compile l10n files
REM for f in src/l10n/*.ini; do (cat "$${f}"; echo) >> dist/data.ini; done
REM copy src\l10n\*.ini dist\data.ini
for /f  %%a IN ('@dir /b /on src\l10n\*.ini') do @type "src\l10n\%%a"  >> dist\data.ini && @echo. >> dist\data.ini

echo dataIniLines = function(){/*--keep this line-->dist\data.ini.js
type dist\data.ini >> dist\data.ini.js
echo -----*/}.toString().replace(/\r/g,"").slice("function(){/*--keep this line--".length+1,-9);>>dist\data.ini.js


REM  copy over static assets
mkdir dist\img
copy src\img\* dist\img\
copy src\opensource.htm dist\


REM cp ./node_modules/jakecache/dist/jakecache.js ./node_modules/jakecache/dist/jakecache-sw.js dist/
copy .\node_modules\jakecache\dist\jakecache.js dist\
copy .\node_modules\jakecache\dist\jakecache-sw.js dist\

mkdir dist\help
copy src\help.htm dist\help\index.html
mkdir dist\privacy
copy src\privacy.htm dist\privacy\index.html
mkdir dist\opensource
copy src\opensource.htm dist\opensource\index.html


if [%1]==[build_prod] GOTO build_prod

:build_dev
copy src\manifest-dev.appcache dist\manifest.appcache
echo # Updated %DATE% %TIME% >> dist\manifest.appcache

REM run webpack
node node_modules\webpack\bin\webpack.js --watch -d

GOTO END

:build_prod
copy src\manifest.appcache dist\
echo # Updated %DATE% %TIME% >> dist\manifest.appcache

REM run webpack
node node_modules\webpack\bin\webpack.js -p

REM overwrite the file from webpack
copy /Y src\js\webL10n\l10n-for-local.js dist\l10n.js

GOTO END

:syntax
@echo Syntax:
@echo.
@echo   %0 build_dev
@echo.
@echo      or
@echo.
@echo   %0 build_prod
@echo.
@echo.

:END
