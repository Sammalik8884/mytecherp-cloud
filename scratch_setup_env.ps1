$StorageKey = az storage account keys list --resource-group TestSQL-GWC --account-name mytecherpstggwc8884 --query "[0].value" -o tsv
$StorageConn = "DefaultEndpointsProtocol=https;AccountName=mytecherpstggwc8884;AccountKey=$StorageKey;EndpointSuffix=core.windows.net"

az webapp config appsettings set --resource-group TestSQL-GWC --name mytecherp-cloud-api --settings `
  "ConnectionStrings__DefaultConnection=Server=tcp:mytechsqlsrv-gwc-8884.database.windows.net,1433;Initial Catalog=MyTechERP_DB;User ID=mytechadmin;Password=P@ssw0rd!2026S;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;" `
  "ConnectionStrings__AzureStorage=$StorageConn" `
  "EmailSettings__Password=mqbwygejgvhsrjfn" `
  "EmailSettings__Server=smtp.gmail.com" `
  "EmailSettings__Port=587" `
  "EmailSettings__SenderName=MyTech ERP System" `
  "EmailSettings__SenderEmail=mytechfms@gmail.com" `
  "EmailSettings__EnableSsl=true" `
  "Stripe__SecretKey=sk_test_..." `
  "Stripe__PublishableKey=pk_test_51TCVtUGv46lRNfrQBHBfJmJCWGaJHyO1fr9mA1rkRlWtitTYA4qGYbdV4U1ln2hU3QMJAI490Soc7tmha1nKwYH7008quJm5ND" `
  "Stripe__WebhookSecret=whsec_4cff733cae3c77d5cd58b44c4788340d76b3201213023cf143c14d5012592cc6" `
  "Stripe__SuccessUrl=https://mytecherp-cloud.vercel.app/payment/success?session_id={CHECKOUT_SESSION_ID}" `
  "Stripe__CancelUrl=https://mytecherp-cloud.vercel.app/payment/cancel" `
  "Stripe__SubscriptionSuccessUrl=https://mytecherp-cloud.vercel.app/subscription/success?session_id={CHECKOUT_SESSION_ID}" `
  "Stripe__SubscriptionCancelUrl=https://mytecherp-cloud.vercel.app/subscription/cancel" `
  "JwtSettings__Key=ThisIsMySecretKeyForMyTechERPProject123!" `
  "JwtSettings__Issuer=MyTechERP" `
  "JwtSettings__Audience=MyTechERP_Users" `
  "JwtSettings__DurationInMinutes=60" `
  "FrontendUrls__0=https://mytecherp-cloud.vercel.app" `
  "FrontendUrls__1=https://mytech.vercel.app" `
  "AllowedHosts=*"
