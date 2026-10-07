<#
.SYNOPSIS
  Builds the Athletiq Android app inside Docker (no Java on the host) and optionally installs it.

.DESCRIPTION
  Pipeline:
    1. Preflight   Docker running, Linux engine, memory, project metadata
    2. Toolchain   Build or reuse the athletiq-android-builder image (JDK 25, Node 24, SDK 36, NDK 27, ccache).
                   The image tag is a hash of docker/android/*, so it only rebuilds when the toolchain changes.
    3. Build       Run the container: sync sources, npm ci (only when the lockfile changed), expo prebuild
                   (only when app config changed), Gradle release build. Gradle, npm, ccache and the
                   generated android/ project live in Docker volumes, so repeat builds are incremental.
    4. Artifacts   APK or AAB, build.log, image-build.log and build-info.json in dist/android/<run>/
    5. Install     adb install -r on the chosen device and launch the app (APK only)

  Run without parameters for an interactive menu. Pass -Yes to accept defaults without prompts (CI).

.PARAMETER Format
  apk (default, installable) or aab (Play Store upload).
.PARAMETER Abis
  standard = arm64-v8a + x86_64 (default: phones and emulators), emulator = x86_64 only (fastest), all = all four ABIs.
.PARAMETER Install
  Install the APK on a connected device or emulator and launch it.
.PARAMETER Clean
  Regenerate the native project and drop native build outputs (caches for downloads are kept).
.PARAMETER RebuildImage
  Rebuild the toolchain image without the Docker layer cache.
.PARAMETER Shell
  Open an interactive bash shell in the build container (sources and caches mounted) instead of building.
.PARAMETER Device
  adb serial to install on (default: the only device, or the first emulator).
.PARAMETER MaxWorkers
  Gradle worker count inside the container (default: CPU count, capped at 8).
.PARAMETER OutputRoot
  Folder for run outputs. Default: $env:ATHLETIQ_ANDROID_OUTPUT if set, otherwise dist\android in the project.
.PARAMETER KeepRuns
  Number of run folders to keep in the output root (older ones are deleted). Default 5; 0 keeps everything.
.PARAMETER Yes
  Non-interactive: use defaults for anything not passed.

.EXAMPLE
  npm run build:android
.EXAMPLE
  npm run build:android -- -Yes -Install
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/docker-android-build.ps1 -Format aab -Abis all -Clean -Yes
#>
[CmdletBinding()]
param(
  [ValidateSet('apk', 'aab')] [string] $Format,
  [ValidateSet('standard', 'emulator', 'all')] [string] $Abis,
  [switch] $Install,
  [switch] $Clean,
  [switch] $RebuildImage,
  [switch] $Shell,
  [string] $Device,
  [int] $MaxWorkers = 0,
  [string] $OutputRoot = $env:ATHLETIQ_ANDROID_OUTPUT,
  [int] $KeepRuns = 5,
  [switch] $Yes
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$DockerDir = Join-Path $ProjectRoot 'docker\android'
$ImageName = 'athletiq-android-builder'
$ContainerName = 'athletiq-android-build'
$Volumes = [ordered]@{
  '/workspace'   = 'athletiq-android-workspace'
  '/root/.gradle' = 'athletiq-android-gradle'
  '/root/.npm'   = 'athletiq-android-npm'
  '/root/.ccache' = 'athletiq-android-ccache'
}
$AbiPresets = [ordered]@{
  standard = 'arm64-v8a,x86_64'
  emulator = 'x86_64'
  all      = 'armeabi-v7a,arm64-v8a,x86,x86_64'
}
$PipelineStart = Get-Date
$Interactive = (-not $Yes) -and [Environment]::UserInteractive -and (-not [Console]::IsInputRedirected)
$HasConsole = -not [Console]::IsOutputRedirected
$TotalSteps = 5

# ---------------------------------------------------------------------------
# Output helpers

function Write-Banner {
  Write-Host ''
  Write-Host '  ATHLETIQ  ' -NoNewline -ForegroundColor Black -BackgroundColor Green
  Write-Host '  Dockerized Android build' -ForegroundColor White
  Write-Host '  ------------------------------------------------------------' -ForegroundColor DarkGray
}

function Write-Step([int] $Number, [string] $Title) {
  $script:StepStart = Get-Date
  Write-Host ''
  Write-Host ("[{0}/{1}] {2}" -f $Number, $TotalSteps, $Title) -ForegroundColor Cyan
}

function Write-StepDone {
  $seconds = [int]((Get-Date) - $script:StepStart).TotalSeconds
  Write-Host ("      done in {0}" -f (Format-Duration $seconds)) -ForegroundColor DarkGray
}

function Write-Info([string] $Label, [string] $Value) {
  Write-Host ('      {0,-14}' -f $Label) -NoNewline -ForegroundColor DarkGray
  Write-Host $Value
}

function Write-Ok([string] $Message) { Write-Host "      $Message" -ForegroundColor Green }
function Write-Note([string] $Message) { Write-Host "      $Message" -ForegroundColor Yellow }

function Stop-Pipeline([string] $Message, [string] $Hint) {
  Write-Host ''
  Write-Host "  Build pipeline stopped: $Message" -ForegroundColor Red
  if ($Hint) { Write-Host "  $Hint" -ForegroundColor Yellow }
  exit 1
}

function Format-Duration([int] $Seconds) {
  if ($Seconds -lt 60) { return "${Seconds}s" }
  return ('{0}m {1:00}s' -f [math]::Floor($Seconds / 60), ($Seconds % 60))
}

# Runs a native command without PowerShell turning stderr into errors; returns stdout lines.
function Invoke-Quiet([scriptblock] $Block) {
  $previous = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try { & $Block 2>$null } finally { $ErrorActionPreference = $previous }
}

# Runs a native command, streams its output live and copies it to a log file. Returns the exit code.
function Invoke-Logged([string] $Exe, [string[]] $Arguments, [string] $LogFile, [switch] $Append) {
  $previous = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  $writer = New-Object System.IO.StreamWriter($LogFile, [bool]$Append, (New-Object System.Text.UTF8Encoding($false)))
  try {
    & $Exe @Arguments 2>&1 | ForEach-Object {
      # Windows PowerShell wraps stderr lines in ErrorRecords; empty ones print as the exception type name.
      if ($_ -is [System.Management.Automation.ErrorRecord]) { $line = $_.Exception.Message } else { $line = "$_" }
      if ($line -eq 'System.Management.Automation.RemoteException') { $line = '' }
      $writer.WriteLine($line)
      if ($line -match 'ERROR|error:|FAILED') { Write-Host $line -ForegroundColor Red }
      elseif ($line -match '^#\d+ \[') { Write-Host $line -ForegroundColor Cyan }
      elseif ($line -match '^#\d+ (DONE|CACHED)') { Write-Host $line -ForegroundColor DarkGray }
      else { Write-Host $line }
    }
    return $LASTEXITCODE
  } finally {
    $writer.Dispose()
    $ErrorActionPreference = $previous
  }
}

# ---------------------------------------------------------------------------
# Prompt helpers

function Read-Choice([string] $Title, [object[]] $Options, [int] $Default = 0) {
  Write-Host ''
  Write-Host "  $Title" -ForegroundColor White
  for ($i = 0; $i -lt $Options.Count; $i++) {
    $marker = ' '
    if ($i -eq $Default) { $marker = '>' }
    Write-Host ("   {0} {1}) {2}" -f $marker, ($i + 1), $Options[$i].Label)
  }
  while ($true) {
    $answer = Read-Host ("  Choose 1-{0} [Enter = {1}]" -f $Options.Count, ($Default + 1))
    if ([string]::IsNullOrWhiteSpace($answer)) { return $Options[$Default].Value }
    $number = 0
    if ([int]::TryParse($answer, [ref] $number) -and $number -ge 1 -and $number -le $Options.Count) {
      return $Options[$number - 1].Value
    }
    Write-Host "  Please enter a number from 1 to $($Options.Count)." -ForegroundColor Yellow
  }
}

function Read-YesNo([string] $Question, [bool] $Default) {
  $hint = 'y/N'
  if ($Default) { $hint = 'Y/n' }
  while ($true) {
    $answer = Read-Host "  $Question ($hint)"
    if ([string]::IsNullOrWhiteSpace($answer)) { return $Default }
    if ($answer -match '^(y|yes)$') { return $true }
    if ($answer -match '^(n|no)$') { return $false }
  }
}

# ---------------------------------------------------------------------------
# adb helpers

function Find-Adb {
  $command = Get-Command adb -ErrorAction SilentlyContinue
  if ($command) { return $command.Source }
  $candidates = @($env:ANDROID_HOME, $env:ANDROID_SDK_ROOT, (Join-Path $env:LOCALAPPDATA 'Android\Sdk'))
  $localProperties = Join-Path $ProjectRoot 'android\local.properties'
  if (Test-Path $localProperties) {
    $sdkLine = Select-String -Path $localProperties -Pattern '^sdk\.dir=(.+)$' | Select-Object -First 1
    if ($sdkLine) { $candidates += ($sdkLine.Matches[0].Groups[1].Value -replace '\\\\', '\' -replace '\\:', ':') }
  }
  foreach ($sdk in $candidates) {
    if ($sdk) {
      $adb = Join-Path $sdk 'platform-tools\adb.exe'
      if (Test-Path $adb) { return $adb }
    }
  }
  return $null
}

function Get-AdbDevices([string] $Adb) {
  $lines = Invoke-Quiet { & $Adb devices }
  $devices = @()
  foreach ($line in $lines) {
    if ($line -match '^(\S+)\s+device$') { $devices += $Matches[1] }
  }
  return ,$devices
}

# ---------------------------------------------------------------------------
Write-Banner

# [1/5] Preflight -------------------------------------------------------------
Write-Step 1 'Preflight'

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Stop-Pipeline 'Docker CLI not found.' 'Install Docker Desktop and make sure "docker" is on PATH.'
}
$dockerInfo = Invoke-Quiet { docker info --format '{{.ServerVersion}}|{{.OSType}}|{{.NCPU}}|{{.MemTotal}}' }
if ($LASTEXITCODE -ne 0 -or -not $dockerInfo) {
  Stop-Pipeline 'Docker engine is not reachable.' 'Start Docker Desktop and wait until it reports "Engine running".'
}
$engine = ("$dockerInfo").Trim().Split('|')
if ($engine[1] -ne 'linux') {
  Stop-Pipeline "Docker is using $($engine[1]) containers." 'Switch Docker Desktop to Linux containers.'
}
$memoryGb = [math]::Round([double]$engine[3] / 1GB, 1)
Write-Info 'Docker' ("engine {0}, {1} CPUs, {2} GB memory" -f $engine[0], $engine[2], $memoryGb)
if ($memoryGb -lt 6) {
  Write-Note 'Docker has less than 6 GB of memory; the Gradle build may run out. Raise it in Docker Desktop settings.'
}

$appConfig = (Get-Content (Join-Path $ProjectRoot 'app.json') -Raw | ConvertFrom-Json).expo
$appVersion = $appConfig.version
$appPackage = $appConfig.android.package
$gitSha = Invoke-Quiet { git -C $ProjectRoot rev-parse --short HEAD }
if ($LASTEXITCODE -ne 0 -or -not $gitSha) { $gitSha = 'nogit' }
$gitSha = "$gitSha".Trim()
$gitDirty = Invoke-Quiet { git -C $ProjectRoot status --porcelain }
$dirtyLabel = ''
if ($gitDirty) { $dirtyLabel = ' (uncommitted changes included)' }
Write-Info 'App' ("{0} {1}, package {2}" -f $appConfig.name, $appVersion, $appPackage)
Write-Info 'Source' ("commit {0}{1}" -f $gitSha, $dirtyLabel)

# Interactive choices for anything not passed as a parameter.
if ($Interactive -and -not $Shell) {
  if (-not $Format) {
    $Format = Read-Choice 'Artifact' @(
      @{ Label = 'APK  (install on emulator or phone)'; Value = 'apk' },
      @{ Label = 'AAB  (Google Play upload)'; Value = 'aab' }
    )
  }
  if (-not $Abis) {
    $Abis = Read-Choice 'CPU architectures' @(
      @{ Label = 'arm64-v8a + x86_64  (phones and emulators)'; Value = 'standard' },
      @{ Label = 'x86_64 only  (emulator, fastest build)'; Value = 'emulator' },
      @{ Label = 'all four ABIs  (widest device support, slowest)'; Value = 'all' }
    )
  }
  if (-not $PSBoundParameters.ContainsKey('Clean')) {
    $Clean = [switch](Read-YesNo 'Clean build (regenerate native project)?' $false)
  }
  if ($Format -eq 'apk' -and -not $PSBoundParameters.ContainsKey('Install')) {
    $Install = [switch](Read-YesNo 'Install and launch on the emulator after the build?' $true)
  }
}
if (-not $Format) { $Format = 'apk' }
if (-not $Abis) { $Abis = 'standard' }
if ($Format -eq 'aab' -and $Install) {
  Write-Note 'AAB files cannot be installed directly; skipping install.'
  $Install = [switch]$false
}

$abiList = $AbiPresets[$Abis]
if (-not $OutputRoot) { $OutputRoot = Join-Path $ProjectRoot 'dist\android' }
$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$runDir = Join-Path $OutputRoot $runId
$artifactName = "athletiq-$appVersion-$gitSha-release"

if (-not $Shell) {
  Write-Host ''
  Write-Info 'Artifact' ("{0}.{1}" -f $artifactName, $Format)
  Write-Info 'ABIs' $abiList
  Write-Info 'Clean' ([bool]$Clean)
  Write-Info 'Install' ([bool]$Install)
  Write-Info 'Output' $runDir
  if ($Interactive -and -not (Read-YesNo 'Start the build?' $true)) {
    Write-Host '  Cancelled.' -ForegroundColor Yellow
    exit 0
  }
}

# Fail early if install was requested but no device is available.
$adb = $null
$targetDevice = $null
if ($Install) {
  $adb = Find-Adb
  if (-not $adb) { Stop-Pipeline 'adb not found.' 'Install Android platform-tools or add adb to PATH, or run without -Install.' }
  $devices = Get-AdbDevices $adb
  if ($Device) {
    if ($devices -notcontains $Device) { Stop-Pipeline "Device $Device is not connected." ('Connected: ' + ($devices -join ', ')) }
    $targetDevice = $Device
  } elseif ($devices.Count -eq 0) {
    Stop-Pipeline 'No device or emulator is connected.' 'Start the emulator in Android Studio, or run without -Install.'
  } elseif ($devices.Count -eq 1) {
    $targetDevice = $devices[0]
  } elseif ($Interactive) {
    $targetDevice = Read-Choice 'Install on which device?' ($devices | ForEach-Object { @{ Label = $_; Value = $_ } })
  } else {
    $emulator = $devices | Where-Object { $_ -like 'emulator-*' } | Select-Object -First 1
    if ($emulator) { $targetDevice = $emulator } else { $targetDevice = $devices[0] }
  }
  Write-Info 'Device' $targetDevice
}
Write-StepDone

New-Item -ItemType Directory -Force -Path $runDir | Out-Null

# [2/5] Toolchain image ---------------------------------------------------------
Write-Step 2 'Toolchain image'
$definition = (Get-ChildItem $DockerDir -File | Sort-Object Name | ForEach-Object {
    (Get-Content $_.FullName -Raw) -replace "`r`n", "`n"
  }) -join "`n"
$sha = [System.Security.Cryptography.SHA256]::Create()
$hashBytes = $sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($definition))
$imageTag = (($hashBytes | ForEach-Object { $_.ToString('x2') }) -join '').Substring(0, 12)
$imageRef = "${ImageName}:$imageTag"

Invoke-Quiet { docker image inspect $imageRef } | Out-Null
$imageExists = ($LASTEXITCODE -eq 0)
if ($imageExists -and -not $RebuildImage) {
  Write-Ok "Reusing $imageRef (toolchain definition unchanged)"
} else {
  Write-Info 'Building' "$imageRef (first build downloads the Android SDK and NDK, several GB)"
  $buildArgs = @('build', '--progress=plain', '--tag', $imageRef, '--file', (Join-Path $DockerDir 'Dockerfile'))
  if ($RebuildImage) { $buildArgs += '--no-cache' }
  $buildArgs += $DockerDir
  $imageLog = Join-Path $runDir 'image-build.log'
  $code = Invoke-Logged 'docker' $buildArgs $imageLog
  if ($code -ne 0) {
    # Docker Desktop sometimes drops the client connection while unpacking a large image even though
    # the build finished. Accept the image if it runs; otherwise retry once (layers are cached).
    Invoke-Quiet { docker run --rm --entrypoint true $imageRef } | Out-Null
    if ($LASTEXITCODE -eq 0) {
      Write-Note "docker build exited with $code, but $imageRef is complete and runs; continuing."
    } else {
      Write-Note "docker build exited with $code; retrying once with the layer cache."
      $code = Invoke-Logged 'docker' ($buildArgs | Where-Object { $_ -ne '--no-cache' }) $imageLog -Append
      if ($code -ne 0) { Stop-Pipeline "Toolchain image build failed (exit $code)." "Log: $imageLog" }
    }
  }
  Write-Ok "Built $imageRef"
  # Remove older tags of this pipeline's image; caches live in volumes, not in old images.
  $oldTags = Invoke-Quiet { docker image ls $ImageName --format '{{.Tag}}' } | Where-Object { $_ -and $_ -ne $imageTag }
  foreach ($tag in $oldTags) { Invoke-Quiet { docker image rm "${ImageName}:$tag" } | Out-Null }
}
Write-StepDone

# [3/5] Build -------------------------------------------------------------------
Invoke-Quiet { docker rm -f $ContainerName } | Out-Null
$runArgs = @('run', '--rm', '--init', '--name', $ContainerName)
if ($HasConsole -and ($Interactive -or $Shell)) { $runArgs += '-it' }
$runArgs += @('--mount', "type=bind,source=$ProjectRoot,target=/src,readonly")
$runArgs += @('--mount', "type=bind,source=$runDir,target=/output")
foreach ($target in $Volumes.Keys) { $runArgs += @('--mount', "type=volume,source=$($Volumes[$target]),target=$target") }
$runArgs += @(
  '-e', "FORMAT=$Format",
  '-e', "ABIS=$abiList",
  '-e', ("CLEAN={0}" -f [int][bool]$Clean),
  '-e', "MAX_WORKERS=$MaxWorkers",
  '-e', "ARTIFACT_NAME=$artifactName"
)

if ($Shell) {
  Write-Step 3 'Shell'
  Write-Note 'Sources: /src (read-only). Workspace: /workspace. Run "athletiq-build" to build. Exit with "exit".'
  & docker @($runArgs + @('--entrypoint', 'bash', $imageRef))
  exit $LASTEXITCODE
}

Write-Step 3 "Build ($Format, $abiList)"
$previousPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
& docker @($runArgs + @($imageRef))
$buildExit = $LASTEXITCODE
$ErrorActionPreference = $previousPreference
if ($buildExit -ne 0) {
  Stop-Pipeline "App build failed (exit $buildExit)." "Log: $runDir\build.log   Debug: npm run build:android:shell"
}
Write-StepDone

# [4/5] Artifacts ----------------------------------------------------------------
Write-Step 4 'Artifacts'
$artifact = Get-ChildItem $runDir -File | Where-Object { $_.Extension -eq ".$Format" } | Select-Object -First 1
if (-not $artifact) { Stop-Pipeline 'Build finished but no artifact was produced.' "Check $runDir\build.log" }
$hash = (Get-FileHash $artifact.FullName -Algorithm SHA256).Hash.ToLower()
Write-Info 'File' $artifact.FullName
Write-Info 'Size' ('{0:N1} MB' -f ($artifact.Length / 1MB))
Write-Info 'SHA-256' $hash
Write-Info 'Logs' (Join-Path $runDir 'build.log')
$latestDir = Join-Path $OutputRoot 'latest'
New-Item -ItemType Directory -Force -Path $latestDir | Out-Null
Get-ChildItem $latestDir -File | Remove-Item -Force
Copy-Item (Join-Path $runDir '*') $latestDir -Force
Write-Ok "Also copied to $latestDir"
if ($KeepRuns -gt 0) {
  $oldRuns = @(Get-ChildItem $OutputRoot -Directory | Where-Object { $_.Name -match '^\d{8}-\d{6}$' } |
    Sort-Object Name -Descending | Select-Object -Skip $KeepRuns)
  foreach ($old in $oldRuns) { Remove-Item $old.FullName -Recurse -Force }
  if ($oldRuns.Count) { Write-Info 'Cleanup' ("removed {0} old run folder(s), keeping the last {1}" -f $oldRuns.Count, $KeepRuns) }
}
Write-StepDone

# [5/5] Install ------------------------------------------------------------------
Write-Step 5 'Install'
if (-not $Install) {
  Write-Note 'Skipped. Install later with:'
  Write-Host "      adb install -r `"$($artifact.FullName)`""
} else {
  Write-Info 'Device' $targetDevice
  $installOutput = Invoke-Quiet { & $adb -s $targetDevice install -r $artifact.FullName }
  $installText = ($installOutput | Out-String).Trim()
  if ($installText -match 'INSTALL_FAILED_UPDATE_INCOMPATIBLE') {
    Write-Note "An existing $appPackage on the device is signed with a different key."
    $uninstall = $false
    if ($Interactive) { $uninstall = Read-YesNo "Uninstall it (deletes its app data) and install this build?" $false }
    if (-not $uninstall) { Stop-Pipeline 'Install skipped because of a signature mismatch.' "Uninstall manually: adb -s $targetDevice uninstall $appPackage" }
    Invoke-Quiet { & $adb -s $targetDevice uninstall $appPackage } | Out-Null
    $installText = ((Invoke-Quiet { & $adb -s $targetDevice install -r $artifact.FullName }) | Out-String).Trim()
  }
  if ($installText -notmatch 'Success') { Stop-Pipeline 'adb install failed.' $installText }
  Write-Ok "Installed $appPackage on $targetDevice"
  Invoke-Quiet { & $adb -s $targetDevice shell monkey -p $appPackage -c android.intent.category.LAUNCHER 1 } | Out-Null
  Write-Ok 'Launched the app'
}
Write-StepDone

$total = [int]((Get-Date) - $PipelineStart).TotalSeconds
Write-Host ''
Write-Host ("  Pipeline finished in {0}" -f (Format-Duration $total)) -ForegroundColor Green
Write-Host ''
