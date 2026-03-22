using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Enums
{
    public enum QuotationStatus
    {
        Draft = 0,              
        PendingApproval = 1,    
        Approved = 2,          
        SentToCustomer = 3,    
        Accepted = 4,        
        Rejected = 5,           
        Expired = 6,           
        Revised = 7,         
        Converted = 8
    }
}
