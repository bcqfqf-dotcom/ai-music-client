<#
.SYNOPSIS
    Build AI Music Desktop into a standalone .exe
.DESCRIPTION
    Run from the desktop/ directory:
        .\build.ps1
    Output: dist\AI Music\AI Music.exe
#>

$ErrorActionPreference = "Stop"

Write-Host "=== AI Music Desktop Builder ===" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Check Python
try {
    $pyVer = python --version 2>&1
    Write-Host "[OK] Python: $pyVer" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Python not found. Install Python 3.10+ first." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "`n[*] Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] pip install failed." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Dependencies installed." -ForegroundColor Green

# Clean previous build
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
if (Test-Path "build\ai-music-desktop") { Remove-Item -Recurse -Force "build\ai-music-desktop" }

# Build
Write-Host "`n[*] Building with PyInstaller (this may take a few minutes)..." -ForegroundColor Yellow
python -m PyInstaller build\ai-music-desktop.spec --noconfirm --clean 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] PyInstaller build failed. Run manually for details:" -ForegroundColor Red
    Write-Host "  python -m PyInstaller build\ai-music-desktop.spec --noconfirm --clean" -ForegroundColor White
    exit 1
}

$exePath = "dist\AI Music\AI Music.exe"
if (Test-Path $exePath) {
    $size = (Get-Item $exePath).Length / 1MB
    $totalSize = (Get-ChildItem "dist\AI Music" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "`n[OK] Build successful!" -ForegroundColor Green
    Write-Host "  Exe:       $exePath" -ForegroundColor White
    Write-Host "  Exe size:  $([math]::Round($size, 1)) MB" -ForegroundColor White
    Write-Host "  Total:     $([math]::Round($totalSize, 1)) MB" -ForegroundColor White
    Write-Host "`n  Copy the entire 'dist\AI Music' folder to distribute." -ForegroundColor Gray
} else {
    Write-Host "[ERROR] Build completed but .exe not found." -ForegroundColor Red
    exit 1
}
