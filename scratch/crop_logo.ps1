Add-Type -AssemblyName System.Drawing

$srcPath = Resolve-Path "assets/Mfolks_main - Copy.png"
$srcImg = [System.Drawing.Bitmap]::FromFile($srcPath)

Write-Host "Source Image Dimensions: $($srcImg.Width) x $($srcImg.Height)"

# Crop the left ball portion (approximately square aspect ratio on the left)
# The left logo ball occupies roughly the first height x height square
$cropWidth = [Math]::Min($srcImg.Height, $srcImg.Width)
$cropHeight = $srcImg.Height

$cropRect = New-Object System.Drawing.Rectangle(0, 0, $cropWidth, $cropHeight)
$croppedBall = $srcImg.Clone($cropRect, $srcImg.PixelFormat)

# Function to create a square icon canvas (1024x1024) with white background and centered logo ball
function Make-AppIcon ($outputPath, $size) {
    $canvas = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($canvas)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    # Fill background with white
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $g.FillRectangle($brush, 0, 0, $size, $size)
    
    # Draw cropped ball centered with margin (75% of icon size)
    $drawSize = [int]($size * 0.75)
    $offset = [int](($size - $drawSize) / 2)
    
    $destRect = New-Object System.Drawing.Rectangle($offset, $offset, $drawSize, $drawSize)
    $g.DrawImage($croppedBall, $destRect)
    
    $canvas.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $canvas.Dispose()
    Write-Host "Created app icon: $outputPath ($size x $size)"
}

Make-AppIcon "assets/icon.png" 1024
Make-AppIcon "assets/android-icon-foreground.png" 1024
Make-AppIcon "assets/splash-icon.png" 1024
Make-AppIcon "assets/favicon.png" 48

$croppedBall.Dispose()
$srcImg.Dispose()
Write-Host "Logo ball app icon generation complete!"
