using Azure.Identity;
using Azure.Security.KeyVault.Keys.Cryptography;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities.common;
using MytechERP.Infrastructure.Persistance;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Services
{
    public class DigitalSignatureService :IDigitalSignatureService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _config;
        private readonly CryptographyClient _cryptoClient;

        public DigitalSignatureService(ApplicationDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;

            var keyId = config["AzureKeyVault:KeyId"];
            var credential = new DefaultAzureCredential();
            _cryptoClient = new CryptographyClient(new Uri(keyId), credential);
        }

        public async Task<string> SignDocumentAsync(string entityName, int entityId, string contentToSign, string userId)
        {
            
            using var hasher = SHA256.Create();
            var contentBytes = Encoding.UTF8.GetBytes(contentToSign);
            var digest = hasher.ComputeHash(contentBytes);

            string signatureBase64;
            string keyVersion;

            try
            {
                var signResult = await _cryptoClient.SignAsync(SignatureAlgorithm.RS256, digest);
                signatureBase64 = Convert.ToBase64String(signResult.Signature);
                keyVersion = signResult.KeyId;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Azure KeyVault] Signature Failed: {ex.Message}. Falling back to LOCAL_MOCK_KEY.");
                signatureBase64 = Convert.ToBase64String(digest); // Mock signature is just the digest for local
                keyVersion = "LOCAL_MOCK_KEY";
            }

            var signatureRecord = new DocumentSignature
            {
                EntityName = entityName,
                EntityId = entityId,
                SignedByUserId = userId,
                SignedAt = DateTime.UtcNow,
                KeyVersion = keyVersion,
                Signature = signatureBase64,
                DataHash = Convert.ToBase64String(digest) 
            };

            _context.DocumentSignatures.Add(signatureRecord);
            await _context.SaveChangesAsync();

            return signatureRecord.Signature;
        }

        public async Task<bool> VerifySignatureAsync(string entityName, int entityId, string currentContent)
        {
            var record = await _context.DocumentSignatures
                .OrderByDescending(s => s.SignedAt)
                .FirstOrDefaultAsync(s => s.EntityName == entityName && s.EntityId == entityId);

            if (record == null) return false;

            using var hasher = SHA256.Create();
            var currentBytes = Encoding.UTF8.GetBytes(currentContent);
            var currentDigest = hasher.ComputeHash(currentBytes);

           
            var storedHashBytes = Convert.FromBase64String(record.DataHash);
            if (!CryptographicOperations.FixedTimeEquals(currentDigest, storedHashBytes))
            {
                return false; 
            }

            if (record.KeyVersion == "LOCAL_MOCK_KEY")
            {
                return true;
            }

            var signatureBytes = Convert.FromBase64String(record.Signature);
            try
            {
                var verifyResult = await _cryptoClient.VerifyAsync(SignatureAlgorithm.RS256, currentDigest, signatureBytes);
                return verifyResult.IsValid;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Azure KeyVault] Verification Failed: {ex.Message}");
                return false;
            }
        }
    }
}
    
