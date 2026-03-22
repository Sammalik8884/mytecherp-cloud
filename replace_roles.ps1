$files = Get-ChildItem -Path backend\MytechERP.API\Controllers\*.cs
foreach ($f in $files) {
    $text = [IO.File]::ReadAllText($f.FullName)
    $text = $text -replace 'Roles\.Admin \+ "," \+ Roles\.Manager \+ "," \+ Roles\.Technician', 'Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer + "," + Roles.Technician'
    $text = $text -replace 'Roles\.Admin \+ "," \+ Roles\.Manager(?!\s*\+)', 'Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer'
    $text = $text -replace 'Roles\.Technician \+ "," \+ Roles\.Admin \+ "," \+ Roles\.Manager', 'Roles.Technician + "," + Roles.Admin + "," + Roles.Manager + "," + Roles.Engineer'
    $text = $text -replace 'Roles\.Manager \+ "," \+ Roles\.Admin', 'Roles.Manager + "," + Roles.Engineer + "," + Roles.Admin'
    $text = $text -replace '\[Authorize\(Roles = "Admin,Manager"\)\]', '[Authorize(Roles = "Admin,Manager,Engineer")]'
    [IO.File]::WriteAllText($f.FullName, $text)
}
