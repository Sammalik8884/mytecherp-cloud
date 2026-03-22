using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.Asset;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities.CRM;
using MytechERP.domain.Enums;
using MytechERP.Infrastructure.Persistance;
using OfficeOpenXml;

namespace MyTechERP.Infrastructure.Services
{
    public class AssetImportService : IAssetImportService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        // The exact expected format we give to the user
        private readonly string[] _expectedHeaders = new[] {
            "Name", "SerialNumber", "AssetType", "Status", "SiteId",
            "Location", "Floor", "Room", "Brand", "Model", "ManufacturingDate"
        };

        public AssetImportService(ApplicationDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task<AssetImportResultDto> ImportFromExcelOrCsvAsync(Stream fileStream, string fileName, bool isDryRun)
        {
            ExcelPackage.License.SetNonCommercialPersonal("MytechERP");

            var result = new AssetImportResultDto
            {
                WasDryRun = isDryRun,
                IsSuccess = false
            };

            var tenantId = _currentUserService.TenantId;
            if (tenantId == null)
            {
                throw new UnauthorizedAccessException("Tenant ID is missing for the current user.");
            }

            var validSites = await _context.Sites
                .Where(s => s.TenantId == tenantId)
                .ToDictionaryAsync(s => s.Id, s => s.CategoryId);

            var existingSerialNumbers = await _context.Assets
                .Where(a => a.TenantId == tenantId)
                .Select(a => a.SerialNumber)
                .ToListAsync();
            
            var existingSerialNumbersSet = new HashSet<string>(existingSerialNumbers, StringComparer.OrdinalIgnoreCase);

            var newAssets = new List<Asset>();
            int rowNumber = 0; 
            bool isExcel = fileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase);

            try
            {
                if (isExcel)
                {
                    using (var package = new ExcelPackage(fileStream))
                    {
                        var worksheet = package.Workbook.Worksheets.FirstOrDefault();
                        if (worksheet == null) throw new Exception("No worksheet found in Excel file.");
                        
                        int colCount = worksheet.Dimension?.End.Column ?? 0;
                        int rowCount = worksheet.Dimension?.End.Row ?? 0;

                        if (colCount < 11)
                        {
                            result.Errors.Add(0, $"Invalid format. Required 11 columns, found {colCount}. Please download and use the official template.");
                            return result;
                        }

                        // Validate Exact Headers
                        for (int col = 1; col <= 11; col++)
                        {
                            var headerVal = worksheet.Cells[1, col].Value?.ToString()?.Trim() ?? "";
                            if (!headerVal.Equals(_expectedHeaders[col - 1], StringComparison.OrdinalIgnoreCase))
                            {
                                result.Errors.Add(0, $"Invalid Template Format. Expected column '{_expectedHeaders[col - 1]}' at position {col}, but got '{headerVal}'.");
                                return result;
                            }
                        }
                        
                        for (int row = 2; row <= rowCount; row++)
                        {
                            rowNumber++;
                            string[] cols = new string[11];
                            for (int col = 1; col <= 11; col++)
                            {
                                cols[col - 1] = worksheet.Cells[row, col].Value?.ToString()?.Trim() ?? "";
                            }
                            
                            if (cols.All(string.IsNullOrWhiteSpace)) continue;
                            ProcessRow(cols, validSites, existingSerialNumbersSet, tenantId.Value, result, newAssets, rowNumber);
                        }
                    }
                }
                else // CSV
                {
                    using (var reader = new StreamReader(fileStream))
                    {
                        var headerLine = await reader.ReadLineAsync();
                        if (headerLine != null)
                        {
                            var headers = headerLine.Split(',').Select(h => h.Trim()).ToList();
                            if (headers.Count < 11)
                            {
                                result.Errors.Add(0, $"Invalid CSV format. Required 11 columns, found {headers.Count}. Please download and use the official template.");
                                return result;
                            }

                            for (int i = 0; i < 11; i++)
                            {
                                if (!headers[i].Equals(_expectedHeaders[i], StringComparison.OrdinalIgnoreCase))
                                {
                                    result.Errors.Add(0, $"Invalid Template Format. Expected column '{_expectedHeaders[i]}' at position {i + 1}, but got '{headers[i]}'.");
                                    return result;
                                }
                            }
                            
                            while (!reader.EndOfStream)
                            {
                                rowNumber++;
                                var line = await reader.ReadLineAsync();
                                if (string.IsNullOrWhiteSpace(line)) continue;
                                
                                var parts = line.Split(',');
                                string[] cols = new string[11];
                                for (int i = 0; i < 11; i++) cols[i] = i < parts.Length ? parts[i].Trim() : "";

                                ProcessRow(cols, validSites, existingSerialNumbersSet, tenantId.Value, result, newAssets, rowNumber);
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                result.Errors.Add(0, $"Failed to parse file: {ex.Message}");
                return result;
            }

            result.TotalRowsProcessed = rowNumber;
            result.SuccessfullyParsedCount = newAssets.Count;

            if (isDryRun || result.Errors.Count > 0)
            {
                result.IsSuccess = result.Errors.Count == 0; 
                return result;
            }

            await _context.Assets.AddRangeAsync(newAssets);
            await _context.SaveChangesAsync();
            
            result.IsSuccess = true;
            return result;
        }

        private void ProcessRow(
            string[] cols, 
            Dictionary<int, int> validSites, 
            HashSet<string> existingSerialNumbersSet, 
            int tenantId, 
            AssetImportResultDto result, 
            List<Asset> newAssets, 
            int rowNumber)
        {
            string name = cols[0];
            string serialNumber = cols[1];
            string assetTypeStr = cols[2];
            string statusStr = cols[3];
            string siteIdStr = cols[4];
            string location = cols[5];
            string floor = cols[6];
            string room = cols[7];
            string brand = cols[8];
            string model = cols[9];
            string manufDateStr = cols[10];

            bool rowIsValid = true;
            string rowError = "";

            if (string.IsNullOrEmpty(name)) { rowIsValid = false; rowError += "Name is required. "; }
            if (string.IsNullOrEmpty(serialNumber)) { rowIsValid = false; rowError += "SerialNumber is required. "; }
            if (string.IsNullOrEmpty(siteIdStr)) { rowIsValid = false; rowError += "SiteId is required. "; }

            if (int.TryParse(siteIdStr, out int siteId))
            {
                if (!validSites.ContainsKey(siteId))
                {
                    rowIsValid = false; rowError += $"SiteId '{siteId}' does not belong to your tenant. ";
                }
            }
            else
            {
                rowIsValid = false; rowError += "Invalid SiteId format. ";
                siteId = 0; 
            }

            if (!string.IsNullOrEmpty(serialNumber))
            {
                if (existingSerialNumbersSet.Contains(serialNumber))
                {
                    rowIsValid = false; rowError += $"SerialNumber '{serialNumber}' already exists. ";
                }
                else
                {
                    existingSerialNumbersSet.Add(serialNumber); 
                }
            }

            if (!Enum.TryParse(assetTypeStr, true, out AssetType assetType))
            {
                rowIsValid = false; rowError += $"Invalid AssetType '{assetTypeStr}'. ";
            }
            
            if (!Enum.TryParse(statusStr, true, out AssetStatus status))
            {
                rowIsValid = false; rowError += $"Invalid Status '{statusStr}'. ";
            }

            if (!DateTime.TryParse(manufDateStr, out DateTime manufacturingDate))
            {
                rowIsValid = false; rowError += $"Invalid ManufacturingDate '{manufDateStr}'. ";
            }

            if (!rowIsValid)
            {
                result.Errors.Add(rowNumber, rowError.Trim());
                return; 
            }

            var newAsset = new Asset
            {
                Name = name,
                SerialNumber = serialNumber,
                AssetType = assetType,
                Status = status,
                SiteId = siteId,
                LocationDescription = location,
                Floor = floor,
                Room = room,
                Brand = brand,
                Model = model,
                ManufacturingDate = manufacturingDate,
                
                TenantId = tenantId,
                ExpiryDate = manufacturingDate.AddYears(5),
                CategoryId = validSites.ContainsKey(siteId) ? validSites[siteId] : 0,
                FlexibleData = null // Explicitly unused now
            };

            newAssets.Add(newAsset);
        }
    }
}
