using System;
using System.Drawing;
using System.Linq;
using System.Collections.Generic;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using MytechERP.Application.DTOs.Quotations;
using System.Text.Json;

namespace MyTechERP.Infrastructure.Services
{
    public class SupplyQuotationExcelService
    {
        public byte[] GenerateExcel(SupplyQuotationDto quote)
        {
            ExcelPackage.License.SetNonCommercialOrganization("MyTech Engineering");

            using (var package = new ExcelPackage())
            {
                var ws = package.Workbook.Worksheets.Add("Quotation");

                // --- Brand Colors ---
                var brandColor = ColorTranslator.FromHtml("#005B9A");
                var brandLightColor = ColorTranslator.FromHtml("#E8F4FC");
                var textDarkColor = ColorTranslator.FromHtml("#111827");
                var highlightGoldColor = ColorTranslator.FromHtml("#CA8A04");

                // --- Default Font ---
                ws.Cells.Style.Font.Name = "Arial";
                ws.Cells.Style.Font.Size = 10;

                int currentRow = 1;

                // --- Header Left & Right ---
                ws.Cells["A1"].Value = "To,";
                ws.Cells["A1"].Style.Font.Bold = true;
                
                ws.Cells["A2"].Value = quote.HeaderToName;
                ws.Cells["A2"].Style.Font.Bold = true;
                
                ws.Cells["A3"].Value = quote.HeaderDesignation;
                
                ws.Cells["A4"].Value = quote.HeaderCompany;
                ws.Cells["A4"].Style.Font.Bold = true;
                
                ws.Cells["A5"].Value = quote.HeaderLocation;

                ws.Cells["E3:G3"].Merge = true;
                ws.Cells["E3"].Value = "Quotation # : " + quote.QuoteNumber;
                ws.Cells["E3"].Style.Font.Bold = true;
                ws.Cells["E3"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Right;

                ws.Cells["E4:G4"].Merge = true;
                ws.Cells["E4"].Value = "Date : " + quote.QuoteDate.ToString("dd-MMM-yyyy");
                ws.Cells["E4"].Style.Font.Bold = true;
                ws.Cells["E4"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Right;

                ws.Cells["E5:G5"].Merge = true;
                string revStr = string.IsNullOrWhiteSpace(quote.RevisionNumber) ? "" : " | " + quote.RevisionNumber;
                ws.Cells["E5"].Value = "Date / Rev # : " + quote.QuoteDate.ToString("dd-MMM-yyyy") + revStr;
                ws.Cells["E5"].Style.Font.Bold = true;
                ws.Cells["E5"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Right;

                currentRow = 6;

                // --- Headline ---
                ws.Cells[currentRow, 1, currentRow, 7].Merge = true;
                ws.Cells[currentRow, 1].Value = $"QUOTATION FOR {(quote.QuotationFor ?? "").ToUpper()} (Supply ONLY)";
                ws.Cells[currentRow, 1].Style.Font.Bold = true;
                ws.Cells[currentRow, 1].Style.Font.Size = 12;
                ws.Cells[currentRow, 1].Style.Font.Color.SetColor(Color.White);
                ws.Cells[currentRow, 1].Style.Fill.PatternType = ExcelFillStyle.Solid;
                ws.Cells[currentRow, 1].Style.Fill.BackgroundColor.SetColor(brandColor);
                ws.Cells[currentRow, 1].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                currentRow += 2;

                // --- DYNAMIC COLUMNS SETUP ---
                var supplyColumns = new List<string>();
                try
                {
                    supplyColumns = JsonSerializer.Deserialize<List<string>>(quote.SupplyColumnsJson ?? "[]") ?? new List<string>();
                }
                catch { }

                int totalCols = 5 + supplyColumns.Count; 
                
                // --- Column Widths ---
                ws.Column(1).Width = 5;  // Sr#
                ws.Column(2).Width = 50; // Description
                ws.Column(3).Width = 10; // Qty
                ws.Column(4).Width = 15; // Unit
                int colIndex = 5;
                foreach (var col in supplyColumns)
                {
                    ws.Column(colIndex).Width = 15;
                    colIndex++;
                }
                ws.Column(colIndex).Width = 18; // Amount

                // --- Table Headers ---
                var headers = new List<string> { "#", "Description", "Qty", "Unit" };
                headers.AddRange(supplyColumns);
                headers.Add("Amount");

                for (int i = 0; i < headers.Count; i++)
                {
                    ws.Cells[currentRow, i + 1].Value = headers[i];
                    ws.Cells[currentRow, i + 1].Style.Font.Bold = true;
                    ws.Cells[currentRow, i + 1].Style.Font.Color.SetColor(Color.White);
                    ws.Cells[currentRow, i + 1].Style.Fill.PatternType = ExcelFillStyle.Solid;
                    ws.Cells[currentRow, i + 1].Style.Fill.BackgroundColor.SetColor(brandColor);
                    ws.Cells[currentRow, i + 1].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                    ws.Cells[currentRow, i + 1].Style.Border.BorderAround(ExcelBorderStyle.Thin, Color.White);
                }
                currentRow++;

                // --- Table Rows ---
                foreach (var item in quote.Items.OrderBy(i => i.SNo))
                {
                    ws.Cells[currentRow, 1].Value = item.SNo;
                    ws.Cells[currentRow, 1].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

                    ws.Cells[currentRow, 2].Value = item.Description ?? "";
                    ws.Cells[currentRow, 2].Style.WrapText = true;

                    ws.Cells[currentRow, 3].Value = item.Quantity;
                    ws.Cells[currentRow, 3].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

                    ws.Cells[currentRow, 4].Value = item.Unit ?? "";
                    ws.Cells[currentRow, 4].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

                    var rates = new Dictionary<string, decimal>();
                    try
                    {
                        rates = JsonSerializer.Deserialize<Dictionary<string, decimal>>(item.RatesJson ?? "{}") ?? new Dictionary<string, decimal>();
                    }
                    catch { }

                    int dCol = 5;
                    foreach (var colName in supplyColumns)
                    {
                        decimal rate = 0;
                        if (rates.TryGetValue(colName, out var val)) rate = val;
                        
                        ws.Cells[currentRow, dCol].Value = rate;
                        ws.Cells[currentRow, dCol].Style.Numberformat.Format = "#,##0.00";
                        ws.Cells[currentRow, dCol].Style.Font.Color.SetColor(highlightGoldColor);
                        dCol++;
                    }

                    ws.Cells[currentRow, dCol].Value = item.TotalAmount;
                    ws.Cells[currentRow, dCol].Style.Numberformat.Format = "#,##0.00";
                    ws.Cells[currentRow, dCol].Style.Font.Bold = true;

                    for(int c=1; c <= totalCols; c++)
                    {
                        ws.Cells[currentRow, c].Style.Border.BorderAround(ExcelBorderStyle.Thin, ColorTranslator.FromHtml("#D1D5DB"));
                    }
                    currentRow++;
                }

                currentRow += 2;

                // --- TERMS AND CONDITIONS ---
                if (!string.IsNullOrWhiteSpace(quote.TermsAndConditionsJson))
                {
                    ws.Cells[currentRow, 1, currentRow, totalCols].Merge = true;
                    ws.Cells[currentRow, 1].Value = "TERMS & CONDITIONS";
                    ws.Cells[currentRow, 1].Style.Font.Bold = true;
                    ws.Cells[currentRow, 1].Style.Font.Color.SetColor(brandColor);
                    ws.Cells[currentRow, 1].Style.Fill.PatternType = ExcelFillStyle.Solid;
                    ws.Cells[currentRow, 1].Style.Fill.BackgroundColor.SetColor(brandLightColor);
                    ws.Cells[currentRow, 1].Style.Border.BorderAround(ExcelBorderStyle.Thin, brandColor);
                    currentRow++;

                    ws.Cells[currentRow, 1, currentRow, totalCols].Merge = true;
                    ws.Cells[currentRow, 1].Value = quote.TermsAndConditionsJson;
                    ws.Cells[currentRow, 1].Style.WrapText = true;
                    currentRow++;
                }

                return package.GetAsByteArray();
            }
        }
    }
}
