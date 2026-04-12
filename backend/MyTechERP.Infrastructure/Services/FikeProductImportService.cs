using OfficeOpenXml;
using MytechERP.domain.Entities;
using MytechERP.Infrastructure.Persistance;
using MytechERP.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System.Globalization;

namespace MyTechERP.Infrastructure.Services
{
    public class FikeProductImportService : IFikeProductImportService
    {
        private readonly ApplicationDbContext _context;

        public FikeProductImportService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<string> ImportExcelAsync(IFormFile file, string brandName, int tenantId)
        {
            using var ms = new System.IO.MemoryStream();
            await file.CopyToAsync(ms);
            return await ImportExcelFromBytesAsync(ms.ToArray(), brandName, tenantId);
        }

        public async Task<string> ImportExcelFromBytesAsync(byte[] fileBytes, string brandName, int tenantId)
        {
            ExcelPackage.License.SetNonCommercialPersonal("MyTechERP");

            int updatedCount = 0, insertedCount = 0;

            using (var memoryStream = new System.IO.MemoryStream(fileBytes))
            {
                using (var package = new ExcelPackage(memoryStream, "Fire2024")) // Fike specific password
                {
                    foreach (var worksheet in package.Workbook.Worksheets)
                {
                    if (worksheet.Dimension == null) continue;

                    int headerRow = FindHeaderRow(worksheet);
                    if (headerRow == -1) continue;

                    var map = MapColumns(worksheet, headerRow);
                    if (!HasRequiredColumns(map)) continue;

                    var category = await GetOrCreateCategoryAsync(worksheet.Name.Trim(), tenantId);

                    var existingProducts = await _context.Products
                        .IgnoreQueryFilters()
                        .Where(p => p.TenantId == tenantId && p.Brand == brandName)
                        .ToListAsync();
                    var productMap = existingProducts
                        .GroupBy(p => p.ItemCode ?? p.Name)
                        .ToDictionary(g => g.Key, g => g.FirstOrDefault());

                    // We will batch save to prevent EF Core ChangeTracker from timing out 
                    int batchSize = 500;
                    int currentBatch = 0;

                    for (int row = headerRow + 1; row <= worksheet.Dimension.End.Row; row++)
                    {
                        string desc = GetBestMatch(worksheet, row, map, "Description", "Desc", "Product Name", "Name");
                        if (string.IsNullOrEmpty(desc)) continue;

                        string itemCode = GetBestMatch(worksheet, row, map, "Item Code", "Part Number", "Part No", "Item");

                        decimal price = GetDecimalValue(worksheet, row, map, "USD", "Price", "Unit Price", "List Price");
                        decimal priceAED = GetDecimalValue(worksheet, row, map, "AED");

                        string uniqueKey = !string.IsNullOrEmpty(itemCode) ? itemCode : desc;

                        var specs = new Dictionary<string, string>();
                        foreach (var col in map)
                        {
                            if (!IsCoreColumn(col.Key))
                            {
                                string val = worksheet.Cells[row, col.Value].Text.Trim();
                                if (!string.IsNullOrEmpty(val) && val != "0" && val != "NA")
                                {
                                    specs[col.Key] = val;
                                }
                            }
                        }

                        productMap.TryGetValue(uniqueKey, out var existing);
                        
                        if (existing != null)
                        {
                            existing.Name = desc;
                            existing.Price = price; 
                            existing.PriceAED = priceAED;
                            if (specs.Count > 0) existing.TechnicalSpecs = JsonConvert.SerializeObject(specs);
                            existing.Brand = brandName;
                            updatedCount++;
                            currentBatch++;
                        }
                        else
                        {
                            var newProduct = new Product
                            {
                                Name = desc,
                                Description = desc,
                                ItemCode = uniqueKey,
                                Price = price,
                                PriceAED = priceAED,
                                Brand = brandName,
                                CategoryId = category.Id,
                                TenantId = tenantId,
                                TechnicalSpecs = JsonConvert.SerializeObject(specs)
                            };
                            _context.Products.Add(newProduct);
                            productMap[uniqueKey] = newProduct;
                            insertedCount++;
                            currentBatch++;
                        }

                        if (currentBatch >= batchSize)
                        {
                            await _context.SaveChangesAsync();
                            currentBatch = 0;
                        }
                    }
                }
                await _context.SaveChangesAsync();
            }
            }
            return $"FIKE Imported: {insertedCount} New, {updatedCount} Updated.";
        }

        private int FindHeaderRow(ExcelWorksheet ws)
        {
            for (int r = 1; r <= 15; r++)
            {
                for (int c = 1; c <= ws.Dimension.End.Column; c++)
                {
                    var text = ws.Cells[r, c].Text.ToLower();
                    if (text.Contains("description") || text.Contains("part no") || text.Contains("item code")) return r;
                }
            }
            return -1;
        }

        private bool HasRequiredColumns(Dictionary<string, int> map)
        {
            var keys = map.Keys.Select(k => k.ToLower()).ToList();
            bool hasDesc = keys.Any(k => k.Contains("description") || k.Contains("desc") || k.Contains("name"));
            bool hasCode = keys.Any(k => k.Contains("item code") || k.Contains("part number") || k.Contains("part no") || k.Contains("item"));
            return hasDesc || hasCode;
        }

        private Dictionary<string, int> MapColumns(ExcelWorksheet ws, int r)
        {
            var map = new Dictionary<string, int>();
            for (int c = 1; c <= ws.Dimension.End.Column; c++)
            {
                string h = ws.Cells[r, c].Text.Replace("\n", " ").Replace("\r", "").Trim();
                if (!string.IsNullOrEmpty(h)) map[h] = c;
            }
            return map;
        }

        private string GetBestMatch(ExcelWorksheet ws, int r, Dictionary<string, int> m, params string[] possibleKeys)
        {
            foreach (var pk in possibleKeys)
            {
                var key = m.Keys.FirstOrDefault(x => x.IndexOf(pk, StringComparison.OrdinalIgnoreCase) >= 0);
                if (key != null)
                {
                    var val = ws.Cells[r, m[key]].Text.Trim();
                    if (!string.IsNullOrEmpty(val)) return val;
                }
            }
            return null;
        }

        private decimal GetDecimalValue(ExcelWorksheet ws, int r, Dictionary<string, int> m, params string[] possibleKeys)
        {
            foreach (var pk in possibleKeys)
            {
                var key = m.Keys.FirstOrDefault(x => x.IndexOf(pk, StringComparison.OrdinalIgnoreCase) >= 0);
                if (key != null)
                {
                    object val = ws.Cells[r, m[key]].Value;
                    decimal current = ParseDecimal(val);
                    if (current > 0) return current;
                }
            }
            return 0;
        }

        private decimal ParseDecimal(object val)
        {
            if (val == null) return 0;
            if (val is double d) return (decimal)d;
            if (val is decimal dec) return dec;
            if (val is int i) return (decimal)i;

            string s = val.ToString().Replace("$", "").Replace("USD", "").Replace("AED", "").Replace(",", "").Replace(" ", "").Replace("\n", "").Trim();
            if (decimal.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out decimal result))
                return result;
            return 0;
        }

        private bool IsCoreColumn(string h)
        {
            h = h.ToLower();
            return h.Contains("description") || h.Contains("desc") || h.Contains("name") ||
                   h.Contains("item code") || h.Contains("part no") || h.Contains("part number") || h.Contains("item") ||
                   h.Contains("usd") || h.Contains("price") || 
                   h.Contains("aed");
        }

        private async Task<Category> GetOrCreateCategoryAsync(string name, int tenantId)
        {
            var c = await _context.Categories
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.Name == name && x.TenantId == tenantId);
            if (c == null)
            {
                c = new Category { Name = name, TenantId = tenantId };
                _context.Categories.Add(c);
                await _context.SaveChangesAsync();
            }
            return c;
        }
    }
}
