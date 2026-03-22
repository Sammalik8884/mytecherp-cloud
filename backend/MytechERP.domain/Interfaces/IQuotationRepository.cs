using MytechERP.domain.Quotations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MytechERP.domain.Interfaces;
using MytechERP.Application.Interfaces; 
using MytechERP.domain.Entities.CRM;

namespace MytechERP.domain.Interfaces
{
    public interface IQuotationRepository 
    {
        Task<Quotation?> GetQuoteWithItemsAsync(int id);
        Task<Quotation> AddQuoteWithItemsAsync(Quotation quotation);
        Task<Quotation> UpdateQuoteWithItemsAsync( int id,Quotation quotation);
        Task DeleteQuoteWithItemsAsync(int id);
        Task<IEnumerable<Quotation>> GetAllAsync();
    }
}
