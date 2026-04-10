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
    public class ProductImportService : IProductImportService
    {
        private readonly ApplicationDbContext _context;

        public ProductImportService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<string> ImportExcelAsync(IFormFile file, string brandName, int tenantId)
        {
            ExcelPackage.License.SetNonCommercialPersonal("MyTechERP");

            int updatedCount = 0, insertedCount = 0;

            using (var stream = file.OpenReadStream())
            using (var package = new ExcelPackage(stream))
            {
                foreach (var worksheet in package.Workbook.Worksheets)
                {
                    if (worksheet.Dimension == null) continue;

                    int headerRow = FindHeaderRow(worksheet);
                    if (headerRow == -1) continue;

                    var map = MapColumns(worksheet, headerRow);
                    if (!map.ContainsKey("Description") && !map.ContainsKey("Item Code")) continue;

                    var category = await GetOrCreateCategoryAsync(worksheet.Name.Trim(), tenantId);

                    for (int row = headerRow + 1; row <= worksheet.Dimension.End.Row; row++)
                    {
                        string desc = GetValue(worksheet, row, map, "Description");
                        if (string.IsNullOrEmpty(desc)) continue;

                        string itemCode = GetValue(worksheet, row, map, "Item Code")
                                       ?? GetValue(worksheet, row, map, "LIFECO Item Code");

                        decimal price = GetDecimalValue(worksheet, row, map, "USD");
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

                        var existing = await _context.Products
                            .IgnoreQueryFilters()
                            .FirstOrDefaultAsync(p => p.ItemCode == uniqueKey && p.TenantId == tenantId && p.Brand == brandName);
                        if (existing != null)
                        {
                            existing.Name = desc;
                            existing.Price = price; 
                            existing.PriceAED = priceAED;
                            existing.TechnicalSpecs = JsonConvert.SerializeObject(specs);
                            existing.Brand = brandName;
                            updatedCount++;
                        }
                        else
                        {
                            _context.Products.Add(new Product
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
                            });
                            insertedCount++;
                        }
                    }
                }
                await _context.SaveChangesAsync();
            }
            return $"Imported: {insertedCount} New, {updatedCount} Updated.";
        }


        private int FindHeaderRow(ExcelWorksheet ws)
        {
            for (int r = 1; r <= 15; r++)
            {
                for (int c = 1; c <= ws.Dimension.End.Column; c++)
                {
                    if (ws.Cells[r, c].Text.ToLower().Contains("description")) return r;
                }
            }
            return -1;
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

        private string GetValue(ExcelWorksheet ws, int r, Dictionary<string, int> m, string k)
        {
            var key = m.Keys.FirstOrDefault(x => x.IndexOf(k, StringComparison.OrdinalIgnoreCase) >= 0);
            return key != null ? ws.Cells[r, m[key]].Text.Trim() : null;
        }

        private decimal GetDecimalValue(ExcelWorksheet ws, int r, Dictionary<string, int> m, string k)
        {
            var key = m.Keys.FirstOrDefault(x => x.IndexOf(k, StringComparison.OrdinalIgnoreCase) >= 0);
            if (key == null) return 0;

            object val = ws.Cells[r, m[key]].Value;
            return ParseDecimal(val);
        }

        private decimal ParseDecimal(object val)
        {
            if (val == null) return 0;

            if (val is double d) return (decimal)d;
            if (val is decimal dec) return dec;
            if (val is int i) return (decimal)i;

            string s = val.ToString();
            s = s.Replace("$", "")
                 .Replace("USD", "")
                 .Replace("AED", "")
                 .Replace(",", "")
                 .Replace(" ", "")
                 .Replace("\n", "")
                 .Trim();

            if (decimal.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out decimal result))
            {
                return result;
            }
            return 0;
        }

        private bool IsCoreColumn(string h)
        {
            h = h.ToLower();
            return h.Contains("description") ||
                   (h.Contains("item code") && !h.Contains("panel")) ||
                   h.Contains("usd") ||
                   h.Contains("item of") || 
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