param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'

function Resolve-JavaHome {
  if ($env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME 'bin\java.exe'))) {
    return $env:JAVA_HOME
  }

  $localToolchain = Join-Path $env:LOCALAPPDATA 'VectorFieldLabToolchain\jdk21'
  if (Test-Path $localToolchain) {
    $jdk = Get-ChildItem $localToolchain -Directory | Select-Object -First 1
    if ($jdk -and (Test-Path (Join-Path $jdk.FullName 'bin\java.exe'))) {
      return $jdk.FullName
    }
  }

  $java = Get-Command java -ErrorAction SilentlyContinue
  if ($java) {
    return $null
  }

  throw 'Java/JDK was not found. Install JDK 17+ or run the Android toolchain setup described in docs\local-app-packaging.md.'
}

function Resolve-AndroidHome {
  foreach ($candidate in @(
    $env:ANDROID_HOME,
    $env:ANDROID_SDK_ROOT,
    (Join-Path $env:LOCALAPPDATA 'Android\Sdk')
  )) {
    if ($candidate -and (Test-Path (Join-Path $candidate 'platforms\android-36'))) {
      return $candidate
    }
  }

  throw 'Android SDK Platform 36 was not found. Install it with Android Studio or Android CLI before building APK.'
}

Set-Location $ProjectRoot

$javaHome = Resolve-JavaHome
if ($javaHome) {
  $env:JAVA_HOME = $javaHome
  $env:Path = "$env:JAVA_HOME\bin;$env:Path"
}

$env:ANDROID_HOME = Resolve-AndroidHome
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:Path = "$env:ANDROID_HOME\platform-tools;$env:Path"

npm run build
npx cap sync android

Set-Location (Join-Path $ProjectRoot 'android')
.\gradlew.bat assembleDebug
