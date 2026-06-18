$sourceConnString = "Server=tcp:mytecherp-sql-srv-900.database.windows.net,1433;Initial Catalog=MyTechERPDB_Corrupted_June17;Persist Security Info=False;User ID=mytechadmin;Password=ComplexPassword!234;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
$targetConnString = "Server=tcp:mytecherp-sql-srv-900.database.windows.net,1433;Initial Catalog=MyTechERPDB;Persist Security Info=False;User ID=mytechadmin;Password=ComplexPassword!234;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

function Copy-TableData {
    param (
        [string]$tableName,
        [string]$whereClause,
        [bool]$keepIdentity
    )

    $sourceConn = New-Object System.Data.SqlClient.SqlConnection($sourceConnString)
    $sourceConn.Open()
    
    $cmd = $sourceConn.CreateCommand()
    $cmd.CommandText = "SELECT * FROM $tableName $whereClause"
    
    $reader = $cmd.ExecuteReader()
    
    $targetConn = New-Object System.Data.SqlClient.SqlConnection($targetConnString)
    $targetConn.Open()
    
    if ($keepIdentity) {
        $options = [System.Data.SqlClient.SqlBulkCopyOptions]::KeepIdentity
        $bulkCopy = New-Object System.Data.SqlClient.SqlBulkCopy($targetConn, $options, $null)
    } else {
        $bulkCopy = New-Object System.Data.SqlClient.SqlBulkCopy($targetConn)
    }
    
    $bulkCopy.DestinationTableName = $tableName
    
    try {
        $bulkCopy.WriteToServer($reader)
        Write-Host "Successfully copied data to $($tableName)"
    } catch {
        Write-Host "Error copying to $($tableName): $_"
    }
    
    $reader.Close()
    $sourceConn.Close()
    $targetConn.Close()
}

Copy-TableData -tableName "QuotationsItem" -whereClause "WHERE QuotationId = 17" -keepIdentity $false

Write-Host "Done!"
