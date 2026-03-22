using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IDigitalSignatureService
    {
        Task<string> SignDocumentAsync(string entityName, int entityId, string contentToSign, string userId);

        Task<bool> VerifySignatureAsync(string entityName, int entityId, string currentContent);
    }
}
