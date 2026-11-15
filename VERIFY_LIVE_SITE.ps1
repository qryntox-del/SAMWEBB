# Run from VS Code PowerShell: .\VERIFY_LIVE_SITE.ps1
# Read-only verification of the public deployed site; never asks for credentials.
param([string]$Url)
if (-not $Url) { $Url = Read-Host 'Paste the exact public Vercel URL (https://...)' }
$Url = $Url.TrimEnd('/')
if ($Url -notmatch '^https://[^/]+$') { throw 'Use the full HTTPS domain without a path, e.g. https://your-site.vercel.app' }
$routes = @('/', '/work.html', '/project.html', '/admin.html', '/js/firebase-config.js', '/assets/favicon.svg')
foreach ($route in $routes) {
  $target = "$Url$route"
  try {
    $result = Invoke-WebRequest -Uri $target -Method Get -TimeoutSec 20 -UseBasicParsing
    $code = [int]$result.StatusCode
    $label = if($code -eq 200) {'OK'} else {'CHECK'}
    Write-Host "$label $code $route" -ForegroundColor $(if($code -eq 200){'Green'}else{'Yellow'})
  } catch {
    Write-Host "FAILED $route : $($_.Exception.Message)" -ForegroundColor Red
  }
}
Write-Host '\nImportant manual checks:' -ForegroundColor Cyan
Write-Host '1) Open homepage in an Incognito window and verify published Firestore projects.'
Write-Host '2) Admin page should request Firebase login when signed out.'
Write-Host '3) Submit a safe test inquiry and verify it in Firestore (do not send repeated spam).'
Write-Host '4) Check mobile layout and broken images.'
Write-Host '5) If using email/password sign-in, add the deployed domain to Firebase Auth authorized domains.'
