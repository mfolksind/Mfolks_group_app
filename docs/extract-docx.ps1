Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-DocxText {
    param([string]$Path)
    $zip = [System.IO.Compression.ZipFile]::OpenRead($Path)
    $entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
    $stream = $entry.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    $xml = $reader.ReadToEnd()
    $reader.Close()
    $zip.Dispose()
    $xml -replace '<w:tab[^>]*/>', "`t" -replace '</w:p>', "`n" -replace '<[^>]+>', '' -replace '&amp;', '&' -replace '&lt;', '<' -replace '&gt;', '>'
}

Get-DocxText 'c:\Users\asus\Downloads\Ansh_docs\User_Registration_Product_Flow.docx' |
    Out-File -Encoding utf8 'c:\Users\asus\manufacturing-marketplace-app\docs-user-registration.txt'

Get-DocxText 'c:\Users\asus\Downloads\Ansh_docs\Information Architecture of App.docx' |
    Out-File -Encoding utf8 'c:\Users\asus\manufacturing-marketplace-app\docs-information-architecture.txt'

Write-Output 'Done'
