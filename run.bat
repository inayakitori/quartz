:Start
ECHO %date% %time%: restarting: > log.txt
call npx quartz build --watch >> log.txt 
TIMEOUT /T 10
ECHO Exit error code: %errorlevel% >> log.txt 
GOTO:Start