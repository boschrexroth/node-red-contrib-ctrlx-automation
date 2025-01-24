CALL npm info node-red-contrib-ctrlx-automation

::--------------------------------------
:: ERROR HANDLING
::--------------------------------------
::ECHO %ERRORLEVEL%
:: 0=Success
IF '%ERRORLEVEL%' NEQ '0' (
	GOTO error
)

:success
	:: Success
	COLOR A0
	PAUSE
	EXIT 0

:error
	:: Error
	COLOR C0
	PAUSE
	EXIT 1
