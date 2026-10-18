$ErrorActionPreference = 'Stop'
$taskDocPath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\EKalusugan_User_Manual.docx'))
$taskPdfPath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\qa\EKalusugan_User_Manual.pdf'))
$taskWord = $null
$taskDocument = $null
try {
    $taskWord = New-Object -ComObject Word.Application
    $taskWord.Visible = $false
    $taskWord.DisplayAlerts = 0
    $taskDocument = $taskWord.Documents.Open($taskDocPath, $false, $false, $false)
    $taskDocument.Fields.Update() | Out-Null
    $taskDocument.Repaginate()
    foreach ($taskToc in $taskDocument.TablesOfContents) { $taskToc.Update() }
    $taskDocument.Repaginate()
    $taskDocument.Save()
    $taskDocument.ExportAsFixedFormat($taskPdfPath, 17)
    Write-Output "Rendered $($taskDocument.ComputeStatistics(2)) pages"
} finally {
    if ($null -ne $taskDocument) { $taskDocument.Close(0) | Out-Null; [System.Runtime.InteropServices.Marshal]::ReleaseComObject($taskDocument) | Out-Null }
    if ($null -ne $taskWord) { $taskWord.Quit(); [System.Runtime.InteropServices.Marshal]::ReleaseComObject($taskWord) | Out-Null }
}
