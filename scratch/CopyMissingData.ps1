$sourceConnString = "Server=tcp:mytecherp-sql-srv-900.database.windows.net,1433;Initial Catalog=MyTechERPDB_Corrupted_June17;Persist Security Info=False;User ID=mytechadmin;Password=ComplexPassword!234;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
$targetConnString = "Server=tcp:mytecherp-sql-srv-900.database.windows.net,1433;Initial Catalog=MyTechERPDB;Persist Security Info=False;User ID=mytechadmin;Password=ComplexPassword!234;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

function Copy-TableData {
    param (
        [string]$tableName,
        [string]$whereClause
    )

    $sourceConn = New-Object System.Data.SqlClient.SqlConnection($sourceConnString)
    $sourceConn.Open()
    
    $cmd = $sourceConn.CreateCommand()
    $cmd.CommandText = "SELECT * FROM $tableName $whereClause"
    
    $reader = $cmd.ExecuteReader()
    
    $targetConn = New-Object System.Data.SqlClient.SqlConnection($targetConnString)
    $targetConn.Open()
    
    $options = [System.Data.SqlClient.SqlBulkCopyOptions]::KeepIdentity
    $bulkCopy = New-Object System.Data.SqlClient.SqlBulkCopy($targetConn, $options, $null)
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

Copy-TableData -tableName "SalesLeads" -whereClause "WHERE Id IN (249, 250)"
Copy-TableData -tableName "Quotations" -whereClause "WHERE Id = 17"
Copy-TableData -tableName "QuotationsItem" -whereClause "WHERE QuotationId = 17"
Copy-TableData -tableName "SiteVisits" -whereClause "WHERE CreatedAt > '2026-06-16 12:00:00'"

Write-Host "Done!"
