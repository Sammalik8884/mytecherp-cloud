Add-Type @"
using System.Net;
using System.Net.Security;
using System.Security.Cryptography.X509Certificates;
public class SSLHelper {
    public static void IgnoreSSL() {
        ServicePointManager.ServerCertificateValidationCallback = 
            (object s, X509Certificate cert, X509Chain chain, SslPolicyErrors err) => true;
        ServicePointManager.SecurityProtocol = 
            SecurityProtocolType.Tls12 | SecurityProtocolType.Tls13;
    }
}
"@

[SSLHelper]::IgnoreSSL()

$creds = az webapp deployment list-publishing-credentials `
    --subscription 37ebfb2d-4087-49fb-a9f5-afd7871d73d5 `
    --name mytecherp-cloud-api `
    --resource-group TestSQL-GWC `
    --query "{user:publishingUserName, pass:publishingPassword}" `
    -o json | ConvertFrom-Json

$user = $creds.user
$pass = $creds.pass
$base64 = [Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes("${user}:${pass}"))
$zipPath = (Resolve-Path "deploy.zip").Path

Write-Host "Uploading $zipPath to Azure..."

$wc = New-Object System.Net.WebClient
$wc.Headers.Add("Authorization", "Basic $base64")
$wc.UploadFile("https://mytecherp-cloud-api.scm.azurewebsites.net/api/zipdeploy", "POST", $zipPath)

Write-Host "Deployment completed successfully!"
