using System;
using System.Drawing;
using System.Linq;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using MytechERP.Application.DTOs.Quotations;
using System.Text.Json;

namespace MyTechERP.Infrastructure.Services
{
    public class QuotationExcelService
    {
        public byte[] GenerateExcel(QuotationDto quote)
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

                // --- Column Widths ---
                ws.Column(1).Width = 5;  // Sr#
                ws.Column(2).Width = 50; // Description
                ws.Column(3).Width = 15; // Unit
                ws.Column(4).Width = 10; // Qty
                ws.Column(5).Width = 15; // Unit Price
                ws.Column(6).Width = 18; // Amount

                int currentRow = 1;

                // --- Header ---
                ws.Cells[currentRow, 1, currentRow, 6].Merge = true;
                ws.Cells[currentRow, 1].Value = "MY TECH ENGINEERING COMPANY PVT LTD";
                ws.Cells[currentRow, 1].Style.Font.Bold = true;
                ws.Cells[currentRow, 1].Style.Font.Size = 14;
                ws.Cells[currentRow, 1].Style.Font.Color.SetColor(Color.White);
                ws.Cells[currentRow, 1].Style.Fill.PatternType = ExcelFillStyle.Solid;
                ws.Cells[currentRow, 1].Style.Fill.BackgroundColor.SetColor(brandColor);
                ws.Cells[currentRow, 1].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                currentRow++;

                ws.Cells[currentRow, 1, currentRow, 6].Merge = true;
                ws.Cells[currentRow, 1].Value = "Industrial & Commercial Solutions";
                ws.Cells[currentRow, 1].Style.Font.Color.SetColor(Color.White);
                ws.Cells[currentRow, 1].Style.Fill.PatternType = ExcelFillStyle.Solid;
                ws.Cells[currentRow, 1].Style.Fill.BackgroundColor.SetColor(brandColor);
                ws.Cells[currentRow, 1].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                currentRow += 2;

                // --- Meta Info ---
                void DrawMetaRow(int row, int startCol, string label, string value, bool highlight = false)
                {
                    ws.Cells[row, startCol].Value = label;
                    ws.Cells[row, startCol].Style.Font.Bold = true;
                    ws.Cells[row, startCol].Style.Fill.PatternType = ExcelFillStyle.Solid;
                    if (highlight)
                    {
                        ws.Cells[row, startCol].Style.Fill.BackgroundColor.SetColor(brandColor);
                        ws.Cells[row, startCol].Style.Font.Color.SetColor(Color.White);
                    }
                    else
                    {
                        ws.Cells[row, startCol].Style.Fill.BackgroundColor.SetColor(brandLightColor);
                        ws.Cells[row, startCol].Style.Font.Color.SetColor(textDarkColor);
                    }
                    ws.Cells[row, startCol].Style.Border.BorderAround(ExcelBorderStyle.Thin);

                    ws.Cells[row, startCol + 1].Value = value;
                    ws.Cells[row, startCol + 1].Style.Font.Bold = true;
                    if (highlight) ws.Cells[row, startCol + 1].Style.Font.Color.SetColor(brandColor);
                    ws.Cells[row, startCol + 1].Style.Border.BorderAround(ExcelBorderStyle.Thin);
                }

                DrawMetaRow(currentRow, 1, "To", quote.CustomerName, true);
                DrawMetaRow(currentRow, 5, "Quotation #", quote.QuoteNumber, true);
                currentRow++;

                if (!string.IsNullOrWhiteSpace(quote.ContactPersonName))
                    DrawMetaRow(currentRow, 1, "Contact Person", quote.ContactPersonName);
                DrawMetaRow(currentRow, 5, "Date", quote.UpdatedAt.ToString("dd-MMM-yyyy"));
                currentRow++;

                if (!string.IsNullOrWhiteSpace(quote.SiteName))
                    DrawMetaRow(currentRow, 1, "Project / Site", quote.SiteName);
                if (quote.RevisionNumber > 0)
                    DrawMetaRow(currentRow, 5, "Revision", $"R{quote.RevisionNumber}");
                currentRow += 2;

                // --- Headline ---
                if (!string.IsNullOrWhiteSpace(quote.QuoteHeadline))
                {
                    ws.Cells[currentRow, 1, currentRow, 6].Merge = true;
                    ws.Cells[currentRow, 1].Value = $"QUOTATION FOR: {quote.QuoteHeadline.ToUpper()}";
                    ws.Cells[currentRow, 1].Style.Font.Bold = true;
                    ws.Cells[currentRow, 1].Style.Font.Size = 12;
                    ws.Cells[currentRow, 1].Style.Font.Color.SetColor(Color.White);
                    ws.Cells[currentRow, 1].Style.Fill.PatternType = ExcelFillStyle.Solid;
                    ws.Cells[currentRow, 1].Style.Fill.BackgroundColor.SetColor(brandColor);
                    ws.Cells[currentRow, 1].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                    currentRow += 2;
                }

                // --- CONTENT SECTIONS ---
                var importedItems = quote.Items.Where(i => i.ItemType == "Imported").ToList();
                var localItems = quote.Items.Where(i => i.ItemType == "Local").ToList();
                var serviceItems = quote.Items.Where(i => i.ItemType == "Service").ToList();
                var importedServiceItems = quote.Items.Where(i => i.ItemType == "ImportedService").ToList();
                var localServiceItems = quote.Items.Where(i => i.ItemType == "LocalService").ToList();

                char sectionLetter = 'A';

                void DrawSection(string title, System.Collections.Generic.List<QuotationItemDto> items)
                {
                    if (!items.Any()) return;

                    // Section Title
                    ws.Cells[currentRow, 1, currentRow, 6].Merge = true;
                    ws.Cells[currentRow, 1].Value = title;
                    ws.Cells[currentRow, 1].Style.Font.Bold = true;
                    ws.Cells[currentRow, 1].Style.Font.Color.SetColor(Color.White);
                    ws.Cells[currentRow, 1].Style.Fill.PatternType = ExcelFillStyle.Solid;
                    ws.Cells[currentRow, 1].Style.Fill.BackgroundColor.SetColor(brandColor);
                    currentRow++;

                    // Table Headers
                    string[] headers = { "#", "Description", "Unit", "Qty", "Unit Rate", "Amount" };
                    for (int i = 0; i < headers.Length; i++)
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

                    // Table Rows
                    int index = 1;
                    foreach (var item in items)
                    {
                        ws.Cells[currentRow, 1].Value = index++;
                        ws.Cells[currentRow, 1].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

                        ws.Cells[currentRow, 2].Value = item.Description ?? "Unknown Service";
                        ws.Cells[currentRow, 2].Style.WrapText = true;

                        string unitText = "-";
                        if (!string.IsNullOrWhiteSpace(item.Unit) && item.UnitQty > 0) unitText = $"{item.UnitQty:G29} {item.Unit}";
                        else if (!string.IsNullOrWhiteSpace(item.Unit)) unitText = item.Unit;
                        ws.Cells[currentRow, 3].Value = unitText;
                        ws.Cells[currentRow, 3].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

                        ws.Cells[currentRow, 4].Value = item.Quantity;
                        ws.Cells[currentRow, 4].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

                        ws.Cells[currentRow, 5].Value = item.UnitPrice;
                        ws.Cells[currentRow, 5].Style.Numberformat.Format = "#,##0.00";
                        ws.Cells[currentRow, 5].Style.Font.Color.SetColor(highlightGoldColor);

                        ws.Cells[currentRow, 6].Value = item.LineTotal;
                        ws.Cells[currentRow, 6].Style.Numberformat.Format = "#,##0.00";
                        ws.Cells[currentRow, 6].Style.Font.Bold = true;

                        for(int c=1; c<=6; c++)
                        {
                            ws.Cells[currentRow, c].Style.Border.BorderAround(ExcelBorderStyle.Thin, ColorTranslator.FromHtml("#D1D5DB"));
                        }
                        currentRow++;
                    }

                    // Section Subtotal
                    decimal sectionTotal = items.Sum(x => x.LineTotal);
                    ws.Cells[currentRow, 1, currentRow, 4].Merge = true;
                    ws.Cells[currentRow, 1].Value = "Section Sub-Total  →";
                    ws.Cells[currentRow, 1].Style.HorizontalAlignment = ExcelHorizontalAlignment.Right;
                    
                    ws.Cells[currentRow, 1, currentRow, 6].Style.Font.Bold = true;
                    ws.Cells[currentRow, 1, currentRow, 6].Style.Font.Color.SetColor(brandColor);
                    ws.Cells[currentRow, 1, currentRow, 6].Style.Fill.PatternType = ExcelFillStyle.Solid;
                    ws.Cells[currentRow, 1, currentRow, 6].Style.Fill.BackgroundColor.SetColor(brandLightColor);

                    ws.Cells[currentRow, 6].Value = sectionTotal;
                    ws.Cells[currentRow, 6].Style.Numberformat.Format = "#,##0.00";

                    for (int c = 1; c <= 6; c++)
                        ws.Cells[currentRow, c].Style.Border.BorderAround(ExcelBorderStyle.Thin, brandColor);

                    currentRow += 2;
                }

                DrawSection($"Section {sectionLetter++}: Imported Items Supply", importedItems);
                DrawSection($"Section {sectionLetter++}: Local Items Supply", localItems);
                DrawSection($"Section {sectionLetter++}: Services", serviceItems);
                DrawSection($"Section {sectionLetter++}: Imported Items Services", importedServiceItems);
                DrawSection($"Section {sectionLetter++}: Local Items Services", localServiceItems);

                // --- FINANCIAL SUMMARY ---
                ws.Cells[currentRow, 5, currentRow, 6].Merge = true;
                ws.Cells[currentRow, 5].Value = "FINANCIAL SUMMARY";
                ws.Cells[currentRow, 5].Style.Font.Bold = true;
                ws.Cells[currentRow, 5].Style.Font.Color.SetColor(Color.White);
                ws.Cells[currentRow, 5].Style.Fill.PatternType = ExcelFillStyle.Solid;
                ws.Cells[currentRow, 5].Style.Fill.BackgroundColor.SetColor(ColorTranslator.FromHtml("#4B5563"));
                currentRow++;

                void DrawSummaryRow(string label, decimal value, bool isGrandTotal = false)
                {
                    ws.Cells[currentRow, 5].Value = label;
                    ws.Cells[currentRow, 6].Value = value;
                    ws.Cells[currentRow, 6].Style.Numberformat.Format = "#,##0.00";

                    ws.Cells[currentRow, 5, currentRow, 6].Style.Border.BorderAround(ExcelBorderStyle.Thin, ColorTranslator.FromHtml("#D1D5DB"));

                    if (isGrandTotal)
                    {
                        ws.Cells[currentRow, 5, currentRow, 6].Style.Font.Bold = true;
                        ws.Cells[currentRow, 5, currentRow, 6].Style.Font.Color.SetColor(Color.White);
                        ws.Cells[currentRow, 5, currentRow, 6].Style.Fill.PatternType = ExcelFillStyle.Solid;
                        ws.Cells[currentRow, 5, currentRow, 6].Style.Fill.BackgroundColor.SetColor(ColorTranslator.FromHtml("#4B5563"));
                    }
                    else
                    {
                        ws.Cells[currentRow, 5, currentRow, 6].Style.Fill.PatternType = ExcelFillStyle.Solid;
                        ws.Cells[currentRow, 5, currentRow, 6].Style.Fill.BackgroundColor.SetColor(ColorTranslator.FromHtml("#F3F4F6"));
                    }
                    currentRow++;
                }

                DrawSummaryRow("Sub Total (Before Taxes)", quote.SubTotal);
                if (quote.GSTPercentage > 0) DrawSummaryRow($"GST @ {quote.GSTPercentage:N0}%", quote.GSTAmount);
                if (quote.IncomeTaxPercentage > 0) DrawSummaryRow($"Income Tax @ {quote.IncomeTaxPercentage:N0}%", quote.IncomeTaxAmount);
                if (quote.ProvincialTaxPercentage > 0)
                {
                    string taxTypeDisplay = string.IsNullOrWhiteSpace(quote.ProvincialTaxType) ? "Provincial Tax" : quote.ProvincialTaxType;
                    DrawSummaryRow($"{taxTypeDisplay} @ {quote.ProvincialTaxPercentage:N0}%", quote.ProvincialTaxAmount);
                }
                if (quote.Adjustment != 0) DrawSummaryRow("Adjustment", quote.Adjustment);

                DrawSummaryRow($"GRAND TOTAL PAYABLE ({quote.Currency})", quote.GrandTotal, true);
                currentRow += 2;

                // --- TERMS AND CONDITIONS ---
                ws.Cells[currentRow, 1, currentRow, 6].Merge = true;
                ws.Cells[currentRow, 1].Value = "TERMS & CONDITIONS";
                ws.Cells[currentRow, 1].Style.Font.Bold = true;
                ws.Cells[currentRow, 1].Style.Font.Color.SetColor(brandColor);
                ws.Cells[currentRow, 1].Style.Fill.PatternType = ExcelFillStyle.Solid;
                ws.Cells[currentRow, 1].Style.Fill.BackgroundColor.SetColor(brandLightColor);
                ws.Cells[currentRow, 1].Style.Border.BorderAround(ExcelBorderStyle.Thin, brandColor);
                currentRow++;

                void DrawTermBlock(string title, string content)
                {
                    if (string.IsNullOrWhiteSpace(content)) return;
                    ws.Cells[currentRow, 1, currentRow, 6].Merge = true;
                    ws.Cells[currentRow, 1].Value = title;
                    ws.Cells[currentRow, 1].Style.Font.Bold = true;
                    ws.Cells[currentRow, 1].Style.Font.Color.SetColor(brandColor);
                    currentRow++;

                    var lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries).Select(l => l.Trim()).Where(l => l.Length > 0).ToArray();
                    foreach (var line in lines)
                    {
                        ws.Cells[currentRow, 1, currentRow, 6].Merge = true;
                        ws.Cells[currentRow, 1].Value = $"• {line}";
                        ws.Cells[currentRow, 1].Style.WrapText = true;
                        currentRow++;
                    }
                    currentRow++;
                }

                MytechERP.domain.Entities.System.TermsAndConditionsTemplate dynamicTc = null;
                if (!string.IsNullOrWhiteSpace(quote.TermsAndConditionsJson))
                {
                    try
                    {
                        dynamicTc = JsonSerializer.Deserialize<MytechERP.domain.Entities.System.TermsAndConditionsTemplate>(
                            quote.TermsAndConditionsJson,
                            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                        );
                    }
                    catch { }
                }

                if (dynamicTc != null && (
                    !string.IsNullOrWhiteSpace(dynamicTc.PaymentAndTax) ||
                    !string.IsNullOrWhiteSpace(dynamicTc.Delivery) ||
                    !string.IsNullOrWhiteSpace(dynamicTc.Warranty) ||
                    !string.IsNullOrWhiteSpace(dynamicTc.PurchaseOrder) ||
                    !string.IsNullOrWhiteSpace(dynamicTc.ValidityAndTransportation) ||
                    !string.IsNullOrWhiteSpace(dynamicTc.General)))
                {
                    DrawTermBlock("Payment & Tax", dynamicTc.PaymentAndTax);
                    DrawTermBlock("Delivery", dynamicTc.Delivery);
                    DrawTermBlock("Warranty", dynamicTc.Warranty);
                    DrawTermBlock("Validity & Transportation", dynamicTc.ValidityAndTransportation);
                    DrawTermBlock("Purchase Order", dynamicTc.PurchaseOrder);
                    DrawTermBlock("General", dynamicTc.General);
                }
                else
                {
                    DrawTermBlock("Payment & Tax", "Prices are on actual basis.\nGST shown separately on supply rates.\nService tax shown separately on installation.\nCurrency: " + quote.Currency + ".\n30% Advance | 60% on Order Confirmation | 10% on Completion.\n100% Advance after Order & advance Payment confirmation.");
                    DrawTermBlock("Delivery", "Stock Available EX-Pakistan.\nDelivery: 8-12 working weeks after order confirmation.");
                    DrawTermBlock("Warranty", "12-month warranty from date of purchase against defective parts.\nDoes not cover consumables, wear & tear.\nDoes not cover misuse, incorrect installation, or natural disasters.\nDoes not cover chemical cleaning damage.");
                    DrawTermBlock("Validity & Transportation", "Quotation validity: 20 days.\nPrices may be adjusted if exchange rate varies > +1%.\nEquipment prices are EX-Karachi; further transport is client scope.\nSite power, travel & accommodation are client scope.");
                    DrawTermBlock("Purchase Order", "Cancellation after PO: 30% of item value charged.\nPartial purchases are not accepted.\nPO must reference our Quotation Number.");
                    DrawTermBlock("General", "LOI must be shared before PO if quotation is awarded.\nAgreement governed by laws of Islamic Republic of Pakistan.");
                }

                return package.GetAsByteArray();
            }
        }
    }
}
