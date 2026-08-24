using MytechERP.Application.DTOs.Quotations;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;

namespace MyTechERP.Infrastructure.Services
{
    public class SupplyQuotationPdfService
    {
        // ── Brand palette ─────────────────────────────────────────
        private static readonly Color Brand       = Color.FromHex("#005B9A");   // deep blue
        private static readonly Color BrandLight  = Color.FromHex("#E8F4FC");   // pale blue
        private static readonly Color RowAlt      = Color.FromHex("#F7FAFE");   // alternating row
        private static readonly Color RowAlt2     = Color.FromHex("#FFFFFF");
        private static readonly Color BorderGrey  = Color.FromHex("#D1D5DB");
        private static readonly Color TextDark    = Color.FromHex("#111827");
        private static readonly Color TextMuted   = Color.FromHex("#6B7280");
        private static readonly Color HighlightGold = Color.FromHex("#CA8A04");

        public byte[] GeneratePdf(SupplyQuotationDto quote)
        {
            QuestPDF.Settings.License = LicenseType.Community;

            var headerImagePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "image2.png");
            var footerImagePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "image3.png");

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.MarginHorizontal(28);
                    page.MarginTop(22);
                    page.MarginBottom(14);
                    page.DefaultTextStyle(x => x
                        .FontFamily(Fonts.Arial)
                        .FontSize(8.5f)
                        .FontColor(TextDark));

                    page.Header().Element(c => ComposeCompanyLogo(c, headerImagePath));
                    page.Content().Element(c => ComposeFullDocument(c, quote));
                    page.Footer().Element(c => ComposeFooter(c, footerImagePath));
                });
            });

            return document.GeneratePdf();
        }

        void ComposeFullDocument(IContainer container, SupplyQuotationDto quote)
        {
            container.Column(col =>
            {
                // ── Meta Info ──
                col.Item().PaddingTop(10).PaddingBottom(6).Element(c => ComposeQuoteMetaInfo(c, quote));

                col.Item().ShowOnce().PaddingTop(4).PaddingBottom(8)
                    .Background(Brand).Padding(8).AlignCenter()
                    .Text($"QUOTATION FOR {(quote.QuotationFor ?? "").ToUpper()} (Supply ONLY)")
                    .Bold().FontSize(9.5f).FontColor(Colors.White);

                // ── CONTENT ──
                col.Item().PaddingTop(6).Element(c => ComposeContent(c, quote));
            });
        }

        void ComposeCompanyLogo(IContainer container, string headerImagePath)
        {
            container.Column(col =>
            {
                if (File.Exists(headerImagePath))
                {
                    col.Item().Image(headerImagePath).FitWidth();
                }
                else
                {
                    col.Item().Padding(10).Background(Brand).Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("MY TECH ENGINEERING COMPANY PVT LTD")
                                .Bold().FontSize(14).FontColor(Colors.White);
                            c.Item().Text("Industrial & Commercial Solutions")
                                .FontSize(8).FontColor(Colors.White);
                        });
                    });
                }
            });
        }

        void ComposeQuoteMetaInfo(IContainer container, SupplyQuotationDto quote)
        {
            container.Column(col =>
            {
                // Meta info row
                col.Item().Row(row =>
                {
                    // LEFT: Customer info boxes (same style as quote # boxes)
                    row.RelativeItem(3).Column(c =>
                    {
                        void InfoRow(string label, string value, bool highlight = false)
                        {
                            c.Item().Table(t =>
                            {
                                t.ColumnsDefinition(cd => { cd.RelativeColumn(); cd.RelativeColumn(1.8f); });
                                t.Cell().Background(highlight ? Brand : BrandLight)
                                    .PaddingHorizontal(5).PaddingVertical(3)
                                    .Text(label).FontSize(8)
                                    .FontColor(highlight ? Colors.White : TextMuted).SemiBold();
                                t.Cell().Border(0.5f).BorderColor(BorderGrey)
                                    .PaddingHorizontal(5).PaddingVertical(3)
                                    .Text(value).FontSize(8)
                                    .FontColor(highlight ? Brand : TextDark).SemiBold();
                            });
                        }

                        if (!string.IsNullOrWhiteSpace(quote.HeaderToName))
                            InfoRow("To", quote.HeaderToName, true);
                        if (!string.IsNullOrWhiteSpace(quote.HeaderDesignation))
                            InfoRow("Designation", quote.HeaderDesignation);
                        if (!string.IsNullOrWhiteSpace(quote.HeaderCompany))
                            InfoRow("Company", quote.HeaderCompany);
                        if (!string.IsNullOrWhiteSpace(quote.HeaderLocation))
                            InfoRow("Location", quote.HeaderLocation);
                    });

                    // CENTER spacer
                    row.ConstantItem(20);

                    // RIGHT: Quote number block
                    row.RelativeItem(2).Column(c =>
                    {
                        void MetaRow(string label, string value, bool highlight = false)
                        {
                            c.Item().Table(t =>
                            {
                                t.ColumnsDefinition(cd => { cd.RelativeColumn(); cd.RelativeColumn(1.2f); });
                                t.Cell().Background(highlight ? Brand : BrandLight)
                                    .PaddingHorizontal(5).PaddingVertical(3)
                                    .Text(label).FontSize(8)
                                    .FontColor(highlight ? Colors.White : TextMuted).SemiBold();
                                t.Cell().Border(0.5f).BorderColor(BorderGrey)
                                    .PaddingHorizontal(5).PaddingVertical(3)
                                    .Text(value).FontSize(8)
                                    .FontColor(highlight ? Brand : TextDark).SemiBold();
                            });
                        }

                        MetaRow("Quotation #", quote.QuoteNumber, true);
                        MetaRow("Date", quote.QuoteDate.ToString("dd-MMM-yyyy"));
                        if (!string.IsNullOrWhiteSpace(quote.RevisionNumber))
                            MetaRow("Revision", quote.RevisionNumber);
                    });
                });
            });
        }

        void ComposeContent(IContainer container, SupplyQuotationDto quote)
        {
            container.Column(col =>
            {
                col.Item().PaddingBottom(14).Element(c => DrawSection(c, quote));
                col.Item().PaddingTop(16).Element(c => ComposeTerms(c, quote));
            });
        }

        void DrawSection(IContainer container, SupplyQuotationDto quote)
        {
            var supplyColumns = new List<string>();
            try
            {
                supplyColumns = JsonSerializer.Deserialize<List<string>>(quote.SupplyColumnsJson ?? "[]") ?? new List<string>();
            }
            catch { }

            container.Column(col => 
            {
                col.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(25);  // #
                        columns.RelativeColumn(3);   // Description
                        columns.RelativeColumn(2);   // Remarks
                        columns.ConstantColumn(40);  // Qty
                        columns.ConstantColumn(40);  // Unit
                        
                        foreach (var colName in supplyColumns)
                        {
                            columns.RelativeColumn(1); // Dynamic rate column
                        }
                        columns.RelativeColumn(1.2f); // Total
                    });

                    // Column headers
                    table.Header(header =>
                    {
                        header.Cell().Element(TH).AlignCenter().Text("#");
                        header.Cell().Element(TH).Text("Description");
                        header.Cell().Element(TH).Text("Remarks");
                        header.Cell().Element(TH).AlignCenter().Text("Qty");
                        header.Cell().Element(TH).AlignCenter().Text("Unit");
                        
                        foreach (var colName in supplyColumns)
                        {
                            header.Cell().Element(TH).AlignRight().Text(colName);
                        }
                        
                        header.Cell().Element(TH).AlignRight().Text("Amount");
                    });

                    // Data rows
                    foreach (var item in quote.Items.OrderBy(i => i.SNo))
                    {
                        bool isAlt = item.SNo % 2 == 0;

                        table.Cell().Element(c => TD(c, isAlt))
                            .AlignCenter().Text(item.SNo.ToString());

                        table.Cell().Element(c => TD(c, isAlt))
                            .Text(item.Description ?? "").FontSize(8);
                            
                        table.Cell().Element(c => TD(c, isAlt))
                            .Text(item.Remarks ?? "").FontSize(8);
                            
                        table.Cell().Element(c => TD(c, isAlt)).AlignCenter().Text(item.Quantity.ToString("G29"));
                        table.Cell().Element(c => TD(c, isAlt)).AlignCenter().Text(item.Unit ?? "");

                        var rates = new Dictionary<string, decimal>();
                        try
                        {
                            rates = JsonSerializer.Deserialize<Dictionary<string, decimal>>(item.RatesJson ?? "{}") ?? new Dictionary<string, decimal>();
                        }
                        catch { }

                        foreach (var colName in supplyColumns)
                        {
                            decimal rate = 0;
                            if (rates.TryGetValue(colName, out var val)) rate = val;
                            table.Cell().Element(c => TD(c, isAlt)).AlignRight().Text(rate.ToString("N2")).FontColor(HighlightGold);
                        }

                        table.Cell().Element(c => TD(c, isAlt)).AlignRight()
                            .Text(item.TotalAmount.ToString("N2")).SemiBold();
                    }

                    // Add Summary Rows
                    int totalCols = 4 + supplyColumns.Count; // #, Desc, Qty, Unit + dynamic + Total(1)
                    
                    // Net Total
                    table.Cell().ColumnSpan((uint)totalCols).Element(c => c.PaddingVertical(4).PaddingHorizontal(5)).AlignRight()
                        .Text("Net Total:").SemiBold().FontSize(9);
                    table.Cell().Element(c => c.PaddingVertical(4).PaddingHorizontal(5)).AlignRight()
                        .Text(quote.NetTotal.ToString("N2")).SemiBold().FontSize(9);

                    // Tax
                    table.Cell().ColumnSpan((uint)totalCols).Element(c => c.PaddingVertical(4).PaddingHorizontal(5)).AlignRight()
                        .Text($"Tax ({quote.TaxPercentage}%):").SemiBold().FontSize(9);
                    table.Cell().Element(c => c.PaddingVertical(4).PaddingHorizontal(5)).AlignRight()
                        .Text(quote.TaxAmount.ToString("N2")).SemiBold().FontSize(9);

                    // Grand Total
                    table.Cell().ColumnSpan((uint)totalCols).Element(c => c.PaddingVertical(4).PaddingHorizontal(5)).AlignRight()
                        .Text("Grand Total:").Bold().FontSize(10);
                    table.Cell().Element(c => c.PaddingVertical(4).PaddingHorizontal(5)).AlignRight()
                        .Text(quote.GrandTotal.ToString("N2")).Bold().FontSize(10).FontColor(Brand);
                });
                
                // Approval block
                col.Item().PaddingTop(15).Row(row =>
                {
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().Text("Issued By:").SemiBold().FontSize(9).FontColor(TextMuted);
                        c.Item().PaddingTop(2).Text(string.IsNullOrWhiteSpace(quote.IssuedBy) ? "________________________" : quote.IssuedBy).FontSize(9).Bold();
                    });
                    
                    row.RelativeItem().AlignRight().Column(c =>
                    {
                        c.Item().Text("Approved By:").SemiBold().FontSize(9).FontColor(TextMuted);
                        c.Item().PaddingTop(2).Text(string.IsNullOrWhiteSpace(quote.ApprovedBy) ? "________________________" : quote.ApprovedBy).FontSize(9).Bold();
                    });
                });
            });
        }

        void ComposeTerms(IContainer container, SupplyQuotationDto quote)
        {
            if (string.IsNullOrWhiteSpace(quote.TermsAndConditionsJson)) return;

            container.Column(col =>
            {
                // Header
                col.Item().Background(BrandLight).Border(0.5f).BorderColor(Brand)
                    .PaddingHorizontal(8).PaddingVertical(5)
                    .Text("TERMS & CONDITIONS").Bold().FontSize(9).FontColor(Brand);

                col.Item().PaddingTop(4).Table(tcTerms =>
                {
                    tcTerms.ColumnsDefinition(tcd => { tcd.RelativeColumn(); tcd.RelativeColumn(); });

                    void TermBlock(string title, string[] points)
                    {
                        tcTerms.Cell().Element(tc => tc.Padding(4)).Column(bc =>
                        {
                            bc.Item().Text(title).Bold().FontSize(9f).FontColor(Brand);
                            foreach (var p in points)
                            {
                                bc.Item().PaddingTop(2).Row(r =>
                                {
                                    r.AutoItem().Text("• ").FontSize(8.5f).FontColor(Brand);
                                    r.RelativeItem().PaddingLeft(2).Text(p).FontSize(8.5f).FontColor(TextDark);
                                });
                            }
                        });
                    }

                    void DynamicTermBlock(string title, string content)
                    {
                        var lines = content.Split('\n', System.StringSplitOptions.RemoveEmptyEntries)
                                           .Select(l => l.Trim())
                                           .Where(l => l.Length > 0)
                                           .ToArray();
                        
                        if (lines.Length > 0)
                        {
                            TermBlock(title, lines);
                        }
                    }

                    // Try to parse dynamic T&C
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
                        void RenderCustomBlock(string title, string content)
                        {
                            if (!string.IsNullOrWhiteSpace(content))
                            {
                                DynamicTermBlock(title, content.Trim());
                            }
                        }

                        RenderCustomBlock("Payment & Tax", dynamicTc.PaymentAndTax);
                        RenderCustomBlock("Delivery", dynamicTc.Delivery);
                        RenderCustomBlock("Warranty", dynamicTc.Warranty);
                        RenderCustomBlock("Validity & Transportation", dynamicTc.ValidityAndTransportation);
                        RenderCustomBlock("Purchase Order", dynamicTc.PurchaseOrder);
                        RenderCustomBlock("General", dynamicTc.General);
                    }
                    else
                    {
                        DynamicTermBlock("General", quote.TermsAndConditionsJson);
                    }
                });
            });
        }

        void ComposeFooter(IContainer container, string footerImagePath)
        {
            container.Column(col =>
            {
                if (File.Exists(footerImagePath))
                {
                    col.Item().PaddingTop(2).Image(footerImagePath).FitWidth();
                }
                else
                {
                    col.Item().LineHorizontal(1f).LineColor(Brand);
                    col.Item().PaddingTop(4).PaddingBottom(2).Row(row =>
                    {
                        row.RelativeItem(2).Column(c =>
                        {
                            c.Item().Text("MY TECH ENGINEERING COMPANY (PVT) LTD")
                                .Bold().FontSize(7f).FontColor(Brand);
                        });
                    });
                }
                
                col.Item().LineHorizontal(0.5f).LineColor(BorderGrey);
                col.Item().PaddingTop(2).AlignCenter().Text(x =>
                {
                    x.Span("Page ").FontSize(7f).FontColor(TextMuted);
                    x.CurrentPageNumber().FontSize(7f).FontColor(TextMuted);
                    x.Span(" of ").FontSize(7f).FontColor(TextMuted);
                    x.TotalPages().FontSize(7f).FontColor(TextMuted);
                });
            });
        }

        static IContainer TH(IContainer c) =>
            c.Background(Brand)
             .Border(0.5f).BorderColor(Colors.White)
             .PaddingHorizontal(5).PaddingVertical(4)
             .DefaultTextStyle(x => x.Bold().FontColor(Colors.White).FontSize(7.5f));

        static IContainer TD(IContainer c, bool alt) =>
            c.Background(alt ? RowAlt : RowAlt2)
             .BorderBottom(0.4f).BorderColor(BorderGrey)
             .PaddingHorizontal(4).PaddingVertical(4)
             .DefaultTextStyle(x => x.FontSize(8f));
    }
}