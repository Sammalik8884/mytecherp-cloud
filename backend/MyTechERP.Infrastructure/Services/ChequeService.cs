using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.Finance;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities.Finance;
using MytechERP.Infrastructure.Persistance;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MytechERP.Infrastructure.Services
{
    public class ChequeService : IChequeService
    {
        private readonly ApplicationDbContext _context;
        private readonly IBlobService _blobService;
        private readonly ICurrentUserService _currentUserService;

        public ChequeService(ApplicationDbContext context, IBlobService blobService, ICurrentUserService currentUserService)
        {
            _context = context;
            _blobService = blobService;
            _currentUserService = currentUserService;
        }

        private ChequeDto MapToDto(Cheque entity)
        {
            var usedAmount = entity.Payments.Sum(p => p.ReleasedAmount);
            return new ChequeDto
            {
                Id = entity.Id,
                ChequeNumber = entity.ChequeNumber,
                InitialAmount = entity.InitialAmount,
                ReleasedAmount = usedAmount,
                RemainingBalance = entity.InitialAmount - usedAmount,
                PictureUrl = string.IsNullOrEmpty(entity.PictureUrl) ? string.Empty : _blobService.GenerateSasUrl(entity.PictureUrl, 1440),
                IsActive = entity.IsActive,
                CreatedAt = entity.CreatedAt
            };
        }

        public async Task<List<ChequeDto>> GetAllAsync()
        {
            var entities = await _context.Cheques
                .Include(c => c.Payments)
                .Where(c => !c.IsDeleted && c.IsActive)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
            return entities.Select(MapToDto).ToList();
        }

        public async Task<ChequeDto> GetByIdAsync(int id)
        {
            var entity = await _context.Cheques
                .Include(c => c.Payments)
                .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
            if (entity == null) throw new Exception("Cheque not found");
            return MapToDto(entity);
        }

        public async Task<ChequeDto> CreateAsync(CreateChequeDto dto)
        {
            var entity = new Cheque
            {
                ChequeNumber = dto.ChequeNumber,
                InitialAmount = dto.InitialAmount,
                PictureUrl = dto.PictureUrl,
                TenantId = _currentUserService.TenantId ?? 0,
                IsActive = true
            };
            _context.Cheques.Add(entity);
            await _context.SaveChangesAsync();
            return MapToDto(entity);
        }

        public async Task<ChequeDto> UpdateAsync(int id, UpdateChequeDto dto)
        {
            var entity = await _context.Cheques.FindAsync(id);
            if (entity == null || entity.IsDeleted) throw new Exception("Cheque not found");

            if (dto.ChequeNumber != null) entity.ChequeNumber = dto.ChequeNumber;
            if (dto.InitialAmount.HasValue) entity.InitialAmount = dto.InitialAmount.Value;
            if (dto.PictureUrl != null) entity.PictureUrl = dto.PictureUrl;
            if (dto.IsActive.HasValue) entity.IsActive = dto.IsActive.Value;

            await _context.SaveChangesAsync();

            return await GetByIdAsync(id);
        }

        public async Task DeleteAsync(int id)
        {
            var entity = await _context.Cheques.FindAsync(id);
            if (entity == null || entity.IsDeleted) throw new Exception("Cheque not found");
            entity.IsDeleted = true;
            await _context.SaveChangesAsync();
        }

        public async Task<string> UploadPictureAsync(IFormFile file)
        {
            var fileName = $"cheque_{Guid.NewGuid()}_{file.FileName}";
            return await _blobService.UploadAsync(file, fileName);
        }
    }
}
