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
                col.Item().Row(row =>
                {
                    // Left-aligned info
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().Text("To,").Bold();
                        if (!string.IsNullOrWhiteSpace(quote.HeaderToName)) c.Item().Text(quote.HeaderToName).Bold();
                        if (!string.IsNullOrWhiteSpace(quote.HeaderDesignation)) c.Item().Text(quote.HeaderDesignation);
                        if (!string.IsNullOrWhiteSpace(quote.HeaderCompany)) c.Item().Text(quote.HeaderCompany).Bold();
                        if (!string.IsNullOrWhiteSpace(quote.HeaderLocation)) c.Item().Text(quote.HeaderLocation);
                    });

                    // Right-aligned Meta blocks
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().PaddingTop(24);
                        c.Item().AlignRight().Text($"Quotation # : {quote.QuoteNumber}").Bold();
                        c.Item().AlignRight().Text($"Date : {quote.QuoteDate:dd-MMM-yyyy}").Bold();
                        var revStr = string.IsNullOrWhiteSpace(quote.RevisionNumber) ? "" : $" | {quote.RevisionNumber}";
                        c.Item().AlignRight().Text($"Date / Rev # : {quote.QuoteDate:dd-MMM-yyyy}{revStr}").Bold();
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

            container.Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(25);  // #
                    columns.RelativeColumn(3);   // Description
                    columns.ConstantColumn(40);  // Qty
                    columns.ConstantColumn(40);  // Unit
                    
                    foreach (var col in supplyColumns)
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
            });
        }

        void ComposeTerms(IContainer container, SupplyQuotationDto quote)
        {
            if (string.IsNullOrWhiteSpace(quote.TermsAndConditionsJson)) return;

            container.Column(col =>
            {
                col.Item().Background(BrandLight).Border(0.5f).BorderColor(Brand)
                    .PaddingHorizontal(8).PaddingVertical(5)
                    .Text("TERMS & CONDITIONS").Bold().FontSize(9).FontColor(Brand);

                col.Item().Padding(5).Text(quote.TermsAndConditionsJson);
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