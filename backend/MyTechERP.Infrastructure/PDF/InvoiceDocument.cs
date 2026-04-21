using MytechERP.domain.Entities.Finance;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System;
using System.IO;
using System.Linq;

namespace MyTechERP.Infrastructure.PDF
{
    public class InvoiceDocument : IDocument
    {
        public Invoice Invoice { get; }
        public string QuoteNumber { get; }
        
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

        public InvoiceDocument(Invoice invoice, string quoteNumber = null)
        {
            Invoice = invoice;
            QuoteNumber = quoteNumber;
        }

        public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

        public void Compose(IDocumentContainer container)
        {
            var headerImagePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "image2.png");
            var footerImagePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "image3.jpeg");

            container
                .Page(page =>
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
                    page.Content().Element(ComposeFullDocument);
                    page.Footer().Element(c => ComposeFooter(c, footerImagePath));
                });
        }

        void ComposeFullDocument(IContainer container)
        {
            container.Column(col =>
            {
                // ── Meta Info (Only on Page 1) ──
                col.Item().PaddingTop(10).PaddingBottom(6).Element(ComposeMetaInfo);

                // ── Headline banner ──
                col.Item().ShowOnce().PaddingTop(4).PaddingBottom(8)
                    .Background(Brand).Padding(8).AlignCenter()
                    .Text("TAX INVOICE")
                    .Bold().FontSize(11f).FontColor(Colors.White).LetterSpacing(1.5f);

                // ── CONTENT ──
                col.Item().PaddingTop(6).Element(ComposeContent);
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

        void ComposeMetaInfo(IContainer container)
        {
            container.Column(col =>
            {
                col.Item().Row(row =>
                {
                    // LEFT: Customer info
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

                        var custName = Invoice.Customer != null ? Invoice.Customer.Name : "Standard Customer";
                        InfoRow("To", custName, true);
                        
                        if (Invoice.Customer != null)
                        {
                            if (!string.IsNullOrWhiteSpace(Invoice.Customer.Email))
                                InfoRow("Email", Invoice.Customer.Email);
                            if (!string.IsNullOrWhiteSpace(Invoice.Customer.Phone))
                                InfoRow("Contact", Invoice.Customer.Phone);
                            if (!string.IsNullOrWhiteSpace(Invoice.Customer.Address))
                                InfoRow("Address", Invoice.Customer.Address);
                        }
                    });

                    // CENTER spacer
                    row.ConstantItem(20);

                    // RIGHT: Invoice number block
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

                        MetaRow("Invoice #", Invoice.InvoiceNumber, true);
                        MetaRow("Issue Date", Invoice.IssueDate.ToString("dd-MMM-yyyy"));
                        MetaRow("Due Date", Invoice.DueDate.ToString("dd-MMM-yyyy"));

                        if (!string.IsNullOrEmpty(QuoteNumber))
                        {
                            MetaRow("Ref Quote #", QuoteNumber);
                        }
                        else if (Invoice.WorkOrderId.HasValue)
                        {
                            MetaRow("Ref Job #", $"WO-{Invoice.WorkOrderId}");
                        }
                    });
                });
            });
        }

        void ComposeContent(IContainer container)
        {
            container.Column(col =>
            {
                col.Item().PaddingBottom(14).Element(DrawSection);
                
                col.Item().PaddingTop(4).Row(row =>
                {
                    row.RelativeItem();
                    row.ConstantItem(280).Element(ComposeSummary);
                });
                
                // Payment instructions / terms
                col.Item().PaddingTop(16).Element(ComposeTerms);
            });
        }

        void DrawSection(IContainer container)
        {
            container.Column(col =>
            {
                col.Item()
                    .Background(Brand)
                    .PaddingHorizontal(8).PaddingVertical(5)
                    .Row(row =>
                    {
                        row.RelativeItem().Text("Invoice Items").Bold().FontSize(9).FontColor(Colors.White);
                    });

                col.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(22);  // Sr#
                        columns.RelativeColumn(5);   // Description
                        columns.ConstantColumn(28);  // Qty
                        columns.ConstantColumn(75);  // Unit Price
                        columns.ConstantColumn(85);  // Total
                    });

                    table.Header(header =>
                    {
                        header.Cell().Element(TH).AlignCenter().Text("#");
                        header.Cell().Element(TH).Text("Description / Service");
                        header.Cell().Element(TH).AlignCenter().Text("Qty");
                        header.Cell().Element(TH).AlignRight().Text("Unit Rate");
                        header.Cell().Element(TH).AlignRight().Text("Amount");
                    });

                    int rowIndex = 0;
                    foreach (var item in Invoice.Items)
                    {
                        rowIndex++;
                        bool isAlt = rowIndex % 2 == 0;

                        table.Cell().Element(c => TD(c, isAlt))
                            .AlignCenter().Text(rowIndex.ToString());
                        
                        table.Cell().Element(c => TD(c, isAlt)).Column(dc =>
                        {
                            dc.Item().Text(item.Description ?? "Unknown Item").FontSize(8);
                        });

                        table.Cell().Element(c => TD(c, isAlt)).AlignCenter().Text(item.Quantity.ToString("0.##"));
                        table.Cell().Element(c => TD(c, isAlt)).AlignRight()
                            .Text(item.UnitPrice.ToString("N2")).FontColor(HighlightGold);
                        table.Cell().Element(c => TD(c, isAlt)).AlignRight()
                            .Text((item.TotalPrice > 0 ? item.TotalPrice : item.Total).ToString("N2")).SemiBold();
                    }
                });
            });
        }

        void ComposeSummary(IContainer container)
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

                    SRow("Sub Total", Invoice.SubTotal.ToString("N2"), bg: BrandLight);

                    if (Invoice.TaxAmount > 0)
                        SRow("Tax", Invoice.TaxAmount.ToString("N2"));

                    SRow("GRAND TOTAL", Invoice.TotalAmount.ToString("N2"),
                         bold: true, bg: BrandAccent, textColor: Colors.White);
                         
                    if (Invoice.AmountPaid > 0)
                    {
                        SRow("Amount Paid", Invoice.AmountPaid.ToString("N2"), bold: true, textColor: Colors.Green.Darken2);
                        SRow("Balance Due", (Invoice.TotalAmount - Invoice.AmountPaid).ToString("N2"), bold: true, bg: BrandLight);
                    }
                });
            });
        }

        void ComposeTerms(IContainer container)
        {
            container.Column(col =>
            {
                col.Item().Background(BrandLight).Border(0.5f).BorderColor(Brand)
                    .PaddingHorizontal(8).PaddingVertical(5)
                    .Text("PAYMENT INSTRUCTIONS & TERMS").Bold().FontSize(9).FontColor(Brand);

                col.Item().PaddingTop(4).Table(tcTerms =>
                {
                    tcTerms.ColumnsDefinition(tcd => { tcd.RelativeColumn(); tcd.RelativeColumn(); });

                    void TermBlock(string title, string[] points)
                    {
                        tcTerms.Cell().Element(tc => tc.Padding(3)).Column(bc =>
                        {
                            bc.Item().Text(title).Bold().FontSize(7.5f).FontColor(Brand);
                            foreach (var p in points)
                                bc.Item().PaddingLeft(4).Text($"\u2022 {p}").FontSize(7f).FontColor(TextMuted);
                        });
                    }

                    TermBlock("Payment Methods", new[]
                    {
                        "All cheques must be payable to MY TECH ENGINEERING COMPANY PVT LTD.",
                        "Direct bank transfers can be sent to the standard account on file.",
                        "Please reference the Invoice Number on all payments."
                    });

                    TermBlock("Terms", new[]
                    {
                        $"Payment is due by {Invoice.DueDate.ToString("dd-MMM-yyyy")}.",
                        "Late payments may be subject to additional fees.",
                        "Thank you for your business!"
                    });
                });
            });
        }

        void ComposeFooter(IContainer container, string footerImagePath)
        {
            container.Column(col =>
            {
                col.Item().LineHorizontal(1f).LineColor(Brand);

                if (File.Exists(footerImagePath))
                {
                    col.Item().PaddingTop(2).Image(footerImagePath).FitWidth();
                }
                else
                {
                    col.Item().PaddingTop(4).PaddingBottom(2).Row(row =>
                    {
                        row.RelativeItem(2).Column(c =>
                        {
                            c.Item().Text("MY TECH ENGINEERING COMPANY (PVT) LTD")
                                .Bold().FontSize(7f).FontColor(Brand);
                            c.Item().Text("Office# 301, 3rd Floor, Munawar Centre, Jinnah Road, Quetta")
                                .FontSize(6f).FontColor(TextMuted);
                            c.Item().Text("NTN: 5277714-4  |  STRN: 0408990001131")
                                .FontSize(6f).FontColor(TextMuted);
                        });

                        row.RelativeItem(2).AlignCenter().Column(c =>
                        {
                            c.Item().AlignCenter().Text("Phone: +92-81-2844718  |  Cell: +92-300-9233273")
                                .FontSize(6f).FontColor(TextMuted);
                            c.Item().AlignCenter().Text("Email: info@mytecheng.com  |  Web: www.mytecheng.com")
                                .FontSize(6f).FontColor(TextMuted);
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
