using MytechERP.Application.DTOs.Quotations;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.IO;
using System.Text.Json;

namespace MyTechERP.Infrastructure.Services
{
    public class QuotationPdfService
    {
        // ── Brand palette ─────────────────────────────────────────
        private static readonly Color Brand       = Color.FromHex("#005B9A");   // deep blue
        private static readonly Color BrandLight  = Color.FromHex("#E8F4FC");   // pale blue
        private static readonly Color BrandAccent = Color.FromHex("#4B5563");   // dark gray for summary
        private static readonly Color BrandAccentLight = Color.FromHex("#F3F4F6");  // light gray
        private static readonly Color RowAlt      = Color.FromHex("#F7FAFE");   // alternating row
        private static readonly Color RowAlt2     = Color.FromHex("#FFFFFF");
        private static readonly Color BorderGrey  = Color.FromHex("#D1D5DB");
        private static readonly Color TextDark    = Color.FromHex("#111827");
        private static readonly Color TextMuted   = Color.FromHex("#6B7280");
        private static readonly Color HighlightGold = Color.FromHex("#CA8A04");

        public byte[] GeneratePdf(QuotationDto quote)
        {
            QuestPDF.Settings.License = LicenseType.Community;
            QuestPDF.Settings.EnableDebugging = true; // Temporary: enable debugging to expose exact element causing conflict

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

        // ─────────────────────────────────────────────────────────
        //  FULL DOCUMENT (header embedded, shown only on page 1)
        // ─────────────────────────────────────────────────────────
        void ComposeFullDocument(IContainer container, QuotationDto quote)
        {
            container.Column(col =>
            {
                // ── Meta Info (Only on Page 1) ──
                col.Item().PaddingTop(10).PaddingBottom(6).Element(c => ComposeQuoteMetaInfo(c, quote));

                if (!string.IsNullOrWhiteSpace(quote.QuoteHeadline))
                {
                    col.Item().ShowOnce().PaddingTop(4).PaddingBottom(8)
                        .Background(Brand).Padding(8).AlignCenter()
                        .Text($"QUOTATION FOR: {quote.QuoteHeadline.ToUpper()}")
                        .Bold().FontSize(9.5f).FontColor(Colors.White);
                }

                // ── CONTENT ──
                col.Item().PaddingTop(6).Element(c => ComposeContent(c, quote));
            });
        }

        // ─────────────────────────────────────────────────────────
        //  HEADER — Repeating Company Letterhead ONLY
        // ─────────────────────────────────────────────────────────
        void ComposeCompanyLogo(IContainer container, string headerImagePath)
        {
            container.Column(col =>
            {
                // Brand image (lightened with white overlay or fallback)
                if (File.Exists(headerImagePath))
                {
                    col.Item().Image(headerImagePath).FitWidth();
                }
                else
                {
                    // Text fallback if image missing
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

        // ─────────────────────────────────────────────────────────
        //  META INFO — Non-repeating quote details
        // ─────────────────────────────────────────────────────────
        void ComposeQuoteMetaInfo(IContainer container, QuotationDto quote)
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

                        InfoRow("To", quote.CustomerName, true);
                        if (!string.IsNullOrWhiteSpace(quote.ContactPersonName))
                            InfoRow("Contact Person", quote.ContactPersonName);
                        if (!string.IsNullOrWhiteSpace(quote.SiteName))
                            InfoRow("Project / Site", quote.SiteName);
                        if (!string.IsNullOrWhiteSpace(quote.BoqReferenceNumber))
                            InfoRow("BOQ Ref #", quote.BoqReferenceNumber);
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
                        MetaRow("Date", quote.UpdatedAt.ToString("dd-MMM-yyyy"));
                        if (quote.RevisionNumber > 0)
                            MetaRow("Revision", $"R{quote.RevisionNumber}");
                    });
                });
            });
        }

        // ─────────────────────────────────────────────────────────
        //  CONTENT — item sections + summary
        // ─────────────────────────────────────────────────────────
        void ComposeContent(IContainer container, QuotationDto quote)
        {
            container.Column(col =>
            {
                var importedItems = quote.Items.Where(i => i.ItemType == "Imported").ToList();
                var localItems    = quote.Items.Where(i => i.ItemType == "Local").ToList();
                var serviceItems  = quote.Items.Where(i => i.ItemType == "Service").ToList();
                var importedServiceItems = quote.Items.Where(i => i.ItemType == "ImportedService").ToList();
                var localServiceItems = quote.Items.Where(i => i.ItemType == "LocalService").ToList();

                char sectionLetter = 'A';

                if (importedItems.Any())
                {
                    col.Item().PaddingBottom(14)
                        .Element(c => DrawSection(c, $"Section {sectionLetter}: Imported Items Supply", importedItems, quote.Currency, true));
                    sectionLetter++;
                }

                if (localItems.Any())
                {
                    col.Item().PaddingBottom(14)
                        .Element(c => DrawSection(c, $"Section {sectionLetter}: Local Items Supply", localItems, quote.Currency, false));
                    sectionLetter++;
                }

                if (serviceItems.Any())
                {
                    col.Item().PaddingBottom(14)
                        .Element(c => DrawSection(c, $"Section {sectionLetter}: Services", serviceItems, quote.Currency, false, false));
                    sectionLetter++;
                }

                if (importedServiceItems.Any())
                {
                    col.Item().PaddingBottom(14)
                        .Element(c => DrawSection(c, $"Section {sectionLetter}: Imported Items Services", importedServiceItems, quote.Currency, false, false));
                    sectionLetter++;
                }

                if (localServiceItems.Any())
                {
                    col.Item().PaddingBottom(14)
                        .Element(c => DrawSection(c, $"Section {sectionLetter}: Local Items Services", localServiceItems, quote.Currency, false, false));
                    sectionLetter++;
                }

                // Grand summary
                col.Item().PaddingTop(4).Row(row =>
                {
                    row.RelativeItem();
                    row.ConstantItem(280).Element(c => ComposeSummary(c, quote));
                });

                // Terms & Conditions
                col.Item().PaddingTop(16).Element(c => ComposeTerms(c, quote));
            });
        }

        // ─────────────────────────────────────────────────────────
        //  SECTION TABLE (with Unit column)
        // ─────────────────────────────────────────────────────────
        void DrawSection(IContainer container, string title, List<QuotationItemDto> items, string currency, bool showCalcBreakdown, bool showUnit = true)
        {
            container.Column(col =>
            {
                // Section header bar
                col.Item()
                    .Background(Brand)
                    .PaddingHorizontal(8).PaddingVertical(5)
                    .Row(row =>
                    {
                        row.RelativeItem().Text(title ?? "").Bold().FontSize(9).FontColor(Colors.White);
                        row.ConstantItem(120).AlignRight()
                            .Text($"Amount in {currency ?? ""}").FontSize(7.5f).FontColor(Colors.White).Italic();
                    });

                col.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(22);  // Sr#
                        columns.RelativeColumn(5);   // Description
                        if (showUnit)
                        {
                            columns.ConstantColumn(55);  // Unit
                        }
                        columns.ConstantColumn(28);  // Qty
                        columns.ConstantColumn(75);  // Unit Price
                        columns.ConstantColumn(85);  // Total
                    });

                    // Column headers
                    table.Header(header =>
                    {
                        header.Cell().Element(TH).AlignCenter().Text("#");
                        header.Cell().Element(TH).Text("Description");
                        if (showUnit)
                        {
                            header.Cell().Element(TH).AlignCenter().Text("Unit");
                        }
                        header.Cell().Element(TH).AlignCenter().Text("Qty");
                        header.Cell().Element(TH).AlignRight().Text($"Unit Rate");
                        header.Cell().Element(TH).AlignRight().Text("Amount");
                    });

                    // Data rows
                    int rowIndex = 0;
                    foreach (var item in items)
                    {
                        rowIndex++;
                        bool isAlt = rowIndex % 2 == 0;

                        table.Cell().Element(c => TD(c, isAlt))
                            .AlignCenter().Text(rowIndex.ToString());
                        
                        // Description cell
                        table.Cell().Element(c => TD(c, isAlt)).Column(dc =>
                        {
                            dc.Item().Text(item.Description ?? "Unknown Service").FontSize(8);
                        });

                        // Unit cell - show unit type and quantity (conditional)
                        if (showUnit)
                        {
                            table.Cell().Element(c => TD(c, isAlt)).AlignCenter().Text(text =>
                            {
                                if (!string.IsNullOrWhiteSpace(item.Unit) && item.UnitQty > 0)
                                {
                                    text.Span($"{item.UnitQty:G29} {item.Unit}").FontSize(7.5f);
                                }
                                else if (!string.IsNullOrWhiteSpace(item.Unit))
                                {
                                    text.Span(item.Unit).FontSize(7.5f);
                                }
                                else
                                {
                                    text.Span("-").FontSize(7.5f).FontColor(TextMuted);
                                }
                            });
                        }

                        table.Cell().Element(c => TD(c, isAlt)).AlignCenter().Text(item.Quantity.ToString());
                        table.Cell().Element(c => TD(c, isAlt)).AlignRight()
                            .Text(item.UnitPrice.ToString("N2")).FontColor(HighlightGold);
                        table.Cell().Element(c => TD(c, isAlt)).AlignRight()
                            .Text(item.LineTotal.ToString("N2")).SemiBold();
                    }

                    // Section sub-total row
                    decimal sectionTotal = items.Sum(x => x.LineTotal);
                    table.Cell().ColumnSpan(showUnit ? (uint)4 : (uint)3)
                        .Background(BrandLight).Border(0.5f).BorderColor(Brand)
                        .PaddingHorizontal(5).PaddingVertical(4)
                        .AlignRight().DefaultTextStyle(x => x.FontSize(8.5f).FontColor(Brand))
                        .Text("Section Sub-Total  →");
                    table.Cell()
                        .Background(BrandLight).Border(0.5f).BorderColor(Brand)
                        .PaddingHorizontal(5).PaddingVertical(4)
                        .DefaultTextStyle(x => x.FontSize(8.5f).FontColor(Brand))
                        .Text("");
                    table.Cell()
                        .Background(BrandLight).Border(0.5f).BorderColor(Brand)
                        .PaddingHorizontal(5).PaddingVertical(4)
                        .AlignRight().DefaultTextStyle(x => x.Bold().FontSize(8.5f).FontColor(Brand))
                        .Text(sectionTotal.ToString("N2"));
                });
            });
        }

        // ─────────────────────────────────────────────────────────
        //  SUMMARY TABLE
        // ─────────────────────────────────────────────────────────
        void ComposeSummary(IContainer container, QuotationDto quote)
        {
            container.Column(col =>
            {
                col.Item().Background(BrandAccent).PaddingHorizontal(8).PaddingVertical(5)
                    .Text("FINANCIAL SUMMARY").Bold().FontSize(9).FontColor(Colors.White);

                col.Item().Table(table =>
                {
                    table.ColumnsDefinition(cd =>
                    {
                        cd.RelativeColumn();
                        cd.ConstantColumn(90);
                    });

                    void SRow(string label, string value, bool bold = false, Color? bg = null, Color? textColor = null)
                    {
                        Func<TextStyle, TextStyle> lStyle = bold
                            ? (TextStyle x) => x.Bold().FontSize(8.5f).FontColor(textColor ?? TextDark)
                            : (TextStyle x) => x.FontSize(8.5f).FontColor(textColor ?? TextDark);

                        table.Cell()
                            .Background(bg ?? RowAlt2)
                            .Border(0.5f).BorderColor(BorderGrey)
                            .PaddingHorizontal(6).PaddingVertical(4)
                            .DefaultTextStyle(lStyle)
                            .Text(label);

                        table.Cell()
                            .Background(bg ?? RowAlt2)
                            .Border(0.5f).BorderColor(BorderGrey)
                            .PaddingHorizontal(6).PaddingVertical(4)
                            .AlignRight()
                            .DefaultTextStyle(lStyle)
                            .Text(value);
                    }

                    SRow("Sub Total (Before Taxes)", quote.SubTotal.ToString("N2"), bg: BrandLight);

                    if (quote.GSTPercentage > 0)
                        SRow($"GST @ {quote.GSTPercentage:N0}%", quote.GSTAmount.ToString("N2"));

                    if (quote.IncomeTaxPercentage > 0)
                        SRow($"Income Tax @ {quote.IncomeTaxPercentage:N0}%", quote.IncomeTaxAmount.ToString("N2"));
                        
                    if (quote.ProvincialTaxPercentage > 0)
                    {
                        string taxTypeDisplay = string.IsNullOrWhiteSpace(quote.ProvincialTaxType) ? "Provincial Tax" : quote.ProvincialTaxType;
                        SRow($"{taxTypeDisplay} @ {quote.ProvincialTaxPercentage:N0}%", quote.ProvincialTaxAmount.ToString("N2"));
                    }

                    if (quote.Adjustment != 0)
                        SRow("Adjustment", quote.Adjustment.ToString("N2"));

                    SRow($"GRAND TOTAL PAYABLE ({quote.Currency ?? ""})", quote.GrandTotal.ToString("N2"),
                         bold: true, bg: BrandAccent, textColor: Colors.White);
                });
            });
        }

        // ─────────────────────────────────────────────────────────
        //  TERMS & CONDITIONS + SIGNATURES
        // ─────────────────────────────────────────────────────────
        void ComposeTerms(IContainer container, QuotationDto quote)
        {
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
                        // Fallback to legacy hardcoded T&C
                        TermBlock("Payment & Tax", new[]
                        {
                            "Prices are on actual basis.",
                            "GST shown separately on supply rates.",
                            "Service tax shown separately on installation.",
                            $"Currency: {quote.Currency}.",
                            "30% Advance | 60% on Order Confirmation | 10% on Completion.",
                            "100% Advance after Order & advance Payment confirmation."
                        });

                        TermBlock("Delivery", new[]
                        {
                            "Stock Available EX-Pakistan.",
                            "Delivery: 8-12 working weeks after order confirmation."
                        });

                        TermBlock("Warranty", new[]
                        {
                            "12-month warranty from date of purchase against defective parts.",
                            "Does not cover consumables, wear & tear.",
                            "Does not cover misuse, incorrect installation, or natural disasters.",
                            "Does not cover chemical cleaning damage."
                        });

                        TermBlock("Validity & Transportation", new[]
                        {
                            "Quotation validity: 20 days.",
                            "Prices may be adjusted if exchange rate varies > +1%.",
                            "Equipment prices are EX-Karachi; further transport is client scope.",
                            "Site power, travel & accommodation are client scope."
                        });

                        TermBlock("Purchase Order", new[]
                        {
                            "Cancellation after PO: 30% of item value charged.",
                            "Partial purchases are not accepted.",
                            "PO must reference our Quotation Number."
                        });

                        TermBlock("General", new[]
                        {
                            "LOI must be shared before PO if quotation is awarded.",
                            "Agreement governed by laws of Islamic Republic of Pakistan."
                        });
                    }
                });

                // Signature row
                col.Item().EnsureSpace().ExtendVertical().AlignBottom().PaddingTop(30).Border(0.5f).BorderColor(BorderGrey).Padding(10).Row(row =>
                {
                    void SigBlock(string role, string name, string title, string phone, string email)
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text(role).Bold().FontSize(7.5f).FontColor(Brand);
                            c.Item().PaddingTop(18).LineHorizontal(0.5f).LineColor(BorderGrey);
                            c.Item().PaddingTop(3).Text(name).SemiBold().FontSize(8.5f);
                            c.Item().Text(title).FontSize(7.5f).FontColor(TextMuted);
                            if (!string.IsNullOrWhiteSpace(phone))
                            {
                                c.Item().Text(phone).FontSize(7.5f).FontColor(TextMuted);
                            }
                            if (!string.IsNullOrWhiteSpace(email))
                            {
                                c.Item().Text(email).FontSize(7f).FontColor(BrandAccent);
                            }
                        });
                    }

                    SigBlock("Approved By:", "Engr. Muhammad Huzefa", "Estimation & Design Engineer",
                        "+92-306-7666644", "m.huzefa@mytecheng.com");

                    row.ConstantItem(30);

                    var prepName = string.IsNullOrWhiteSpace(quote.PreparedByName) ? "System Generated" : quote.PreparedByName;
                    var prepTitle = string.IsNullOrWhiteSpace(quote.PreparedByDesignation) ? "" : quote.PreparedByDesignation;
                    var prepEmail = string.IsNullOrWhiteSpace(quote.PreparedByEmail) ? "" : quote.PreparedByEmail;

                    SigBlock("Prepared By:", prepName, prepTitle, "", prepEmail);
                });
            });
        }

        // ─────────────────────────────────────────────────────────
        //  FOOTER — Expanded with company info, image, and page number below
        // ─────────────────────────────────────────────────────────
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
                    // Top separator
                    col.Item().LineHorizontal(1f).LineColor(Brand);

                    // Expanded footer text content (Fallback if no image)
                    col.Item().PaddingTop(4).PaddingBottom(2).Row(row =>
                    {
                        // LEFT: Company details
                        row.RelativeItem(2).Column(c =>
                        {
                            c.Item().Text("MY TECH ENGINEERING COMPANY (PVT) LTD")
                                .Bold().FontSize(7f).FontColor(Brand);
                            c.Item().Text("Office# 301, 3rd Floor, Munawar Centre, Jinnah Road, Quetta")
                                .FontSize(6f).FontColor(TextMuted);
                            c.Item().Text("NTN: 5277714-4  |  STRN: 0408990001131")
                                .FontSize(6f).FontColor(TextMuted);
                        });

                        // CENTER: Contact info
                        row.RelativeItem(2).AlignCenter().Column(c =>
                        {
                            c.Item().AlignCenter().Text("Phone: +92-81-2844718  |  Cell: +92-300-9233273")
                                .FontSize(6f).FontColor(TextMuted);
                            c.Item().AlignCenter().Text("Email: info@mytecheng.com  |  Web: www.mytecheng.com")
                                .FontSize(6f).FontColor(TextMuted);
                        });
                    });
                }

                // Bottom separator line
                col.Item().LineHorizontal(0.5f).LineColor(BorderGrey);

                // Page number — below the footer
                col.Item().PaddingTop(2).AlignCenter().Text(x =>
                {
                    x.Span("Page ").FontSize(7f).FontColor(TextMuted);
                    x.CurrentPageNumber().FontSize(7f).FontColor(TextMuted);
                    x.Span(" of ").FontSize(7f).FontColor(TextMuted);
                    x.TotalPages().FontSize(7f).FontColor(TextMuted);
                });
            });
        }

        // ─────────────────────────────────────────────────────────
        //  CELL STYLE HELPERS
        // ─────────────────────────────────────────────────────────
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

        // Note: STD style applied inline (no static factory — avoids Container() missing context)
    }
}