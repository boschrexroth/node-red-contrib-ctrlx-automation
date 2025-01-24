::Author: marcmaro (DC-IA/ESW1)
@echo off

::setup
::npmjs.org=0,Artifactory=1
set REGISTRY_SELECTION=1
::disabled=0, enabled=1
set DRYRUN_ENABLED=0
:: npm token (see ./private/.npmrc)

::process
echo Publishes the node package to selected registry (npmjs.org=0, Artifactory=1)
echo
echo Please edit this script to setup, first!
echo For registry 'artifactory', also check your credentials in file '%USERPROFILE%\.npmrc'.

set NPMJS_REGISTRY=https://registry.npmjs.org
set ARTIFACTORY_REGISTRY=https://lo-artifact.de.bosch.com/artifactory/api/npm/npm-local-automationx

::select registry
if %REGISTRY_SELECTION%==0 (	
	set REGISTRY=%NPMJS_REGISTRY%
) else if %REGISTRY_SELECTION%==1 (
	set REGISTRY=%ARTIFACTORY_REGISTRY%
)

echo npm install ...
call npm install --no-fund
if %ERRORLEVEL% NEQ 0 (
	goto error
)

echo npm pack ...
call npm pack
if %ERRORLEVEL% NEQ 0 (	
	goto error
)


::find tarbal in current directory
for %%F in (.\*.tgz) do set TARBAL_NAME=%%F
IF "%TARBAL_NAME%" == "" (
	echo tarbal not found!
	goto error
)

echo:
echo PUBLISH: %TARBAL_NAME% TO %REGISTRY%
echo:
::set /p VERSION=<../VERSION

::proceed?
:again 
set /p answer=Proceed (Y/n)?
if /i "%answer:~,1%" EQU "Y" goto proceed
if /i "%answer:~,1%" EQU "n" goto end
goto again
:proceed


::publish to registry
if %DRYRUN_ENABLED%==1 (	
	echo publishing [DRYRUN] ...	
	call npm publish %TARBAL_NAME% --registry=%REGISTRY% --verbose --dry-run
) else (
	echo publishing ...	
	call npm publish %TARBAL_NAME% --registry=%REGISTRY% --verbose
)

if %ERRORLEVEL% NEQ 0 (	
	goto error
)

:: ERROR HANDLING
:success
	:: Success
	color A0
	pause
    exit 0

:error
	:: Error
	color C0
	pause
    exit /B %ERRORLEVEL%