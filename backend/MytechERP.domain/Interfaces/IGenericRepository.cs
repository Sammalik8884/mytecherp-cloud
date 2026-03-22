using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.Application.Interfaces
{
    public interface IGenericRepository<T> where T : class
    {
        Task<T?> GetByIdAsync(int id, string? includeProperties = null);
        Task<IReadOnlyList<T>> GetAllAsync(string? includeProperties = null);
        Task<T> AddAsync(T entity);
        Task UpdateAsync(T entity);
        Task DeleteAsync(T entity);
        Task<IReadOnlyList<T>> GetPagedResponseAsync(int pageNumber, int pageSize, string? includeProperties = null,Expression<Func<T,bool>>? filter=null);
    }
}
