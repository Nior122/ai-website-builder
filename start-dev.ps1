taskkill /F /IM node.exe 2>$null
Start-Sleep -Seconds 2
Set-Location "c:\Users\PC\Desktop\ai website generator"
npm run dev 2>&1
