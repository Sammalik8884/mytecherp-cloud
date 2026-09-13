using MytechERP.Application.DTOs.SalesInvoices;
using MytechERP.Application.Interfaces;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.IO;

namespace MyTechERP.Infrastructure.Services
{
    public class SalesInvoicePdfService : ISalesInvoicePdfService
    {
        private const string BrandHex = "#0a509f";
        private const string BrandLightHex = "#eef4fa";
        private const string HeaderHex = "#d6e5f3";
        private static readonly Color Brand = Color.FromHex(BrandHex);
        private static readonly Color BrandLight = Color.FromHex(BrandLightHex);
        private static readonly Color HeaderBg = Color.FromHex(HeaderHex);
        private static readonly Color TextDark = Colors.Black;

        public byte[] GeneratePdf(SalesInvoiceDto invoice)
        {
            QuestPDF.Settings.License = LicenseType.Community;

            var headerImagePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "image2.png");
            var footerImagePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "image3.png");

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.MarginHorizontal(35);
                    page.MarginTop(25);
                    page.MarginBottom(25);
                    page.DefaultTextStyle(x => x.FontFamily(Fonts.Arial).FontSize(9).FontColor(TextDark));

                    page.Header().Element(c => ComposeHeader(c, headerImagePath));
                    page.Content().Element(c => ComposeContent(c, invoice));
                    page.Footer().Element(c => ComposeFooter(c, footerImagePath));
                });
            });

            return document.GeneratePdf();
        }

        private void ComposeHeader(IContainer container, string imagePath)
        {
            if (File.Exists(imagePath))
            {
                container.AlignCenter().Height(70).Image(imagePath).FitArea();
            }
        }

        private void ComposeFooter(IContainer container, string imagePath)
        {
            if (File.Exists(imagePath))
            {
                container.AlignCenter().Height(60).Image(imagePath).FitArea();
            }
        }

        private void ComposeContent(IContainer container, SalesInvoiceDto invoice)
        {
            container.PaddingTop(15).Column(col =>
            {
                // Sales Tax Invoice Title
                col.Item().Border(1).BorderColor(Colors.Black).AlignCenter().Padding(4)
                    .Text("Sales Tax Invoice").Bold().FontSize(14);

                // Meta Info Box (Table)
                col.Item().Table(table =>
                {
                    table.ColumnsDefinition(cd =>
                    {
                        cd.RelativeColumn(3); // Left Side
                        cd.RelativeColumn(2); // Right Side
                    });

                    void TCell(IContainer c, string text, bool bold = false)
                    {
                        var cell = c.Border(1).BorderColor(Colors.Black).PaddingHorizontal(4).PaddingVertical(2);
                        if (bold) cell.Text(text).Bold();
                        else cell.Text(text);
                    }

                    // Row 1
                    table.Cell().Element(c => TCell(c, "To,", true));
                    table.Cell().Element(c => TCell(c, $"Invoice Num: {invoice.InvoiceNumber}", true));
                    
                    // Row 2
                    table.Cell().Element(c => TCell(c, invoice.ContactPerson, true));
                    table.Cell().Element(c => TCell(c, "", true)); // blank right? Actually PO Ref is next

                    // Row 3
                    table.Cell().Element(c => TCell(c, invoice.CustomerName, true));
                    table.Cell().Element(c => TCell(c, $"PO Ref: {invoice.PoRef}", true));

                    // Row 4
                    string siteStr = invoice.SiteName;
                    if (!string.IsNullOrWhiteSpace(invoice.SiteNtn))
                        siteStr += $" NTN: {invoice.SiteNtn}";
                    table.Cell().Element(c => TCell(c, siteStr));
                    table.Cell().Element(c => TCell(c, $"My Tech NTN Ref: {invoice.MyTechNtnRef}", true));

                    // Row 5
                    table.Cell().Element(c => TCell(c, $"Project: {invoice.ProjectName}"));
                    table.Cell().Element(c => TCell(c, $"Dated: {invoice.InvoiceDate:d-M-yyyy}", true));

                    // Row 6
                    table.Cell().Element(c => TCell(c, $"Scope Of Work: {invoice.ScopeOfWork}"));
                    table.Cell().Element(c => TCell(c, $"SES Ref: {invoice.SesRef}", true));
                });

                // Items Table
                col.Item().PaddingTop(10).Table(table =>
                {
                    table.ColumnsDefinition(cd =>
                    {
                        cd.ConstantColumn(40);  // S.Num
                        cd.RelativeColumn();    // Item Description
                        cd.ConstantColumn(40);  // QTY
                        cd.ConstantColumn(50);  // UNIT
                        cd.ConstantColumn(80);  // Rate
                        cd.ConstantColumn(90);  // Amount
                    });

                    void HCell(IContainer c, string text)
                    {
                        c.Border(1).BorderColor(Colors.Black).Background(HeaderBg).AlignCenter().PaddingVertical(2).Text(text).Bold().FontSize(8.5f);
                    }

                    table.Cell().Element(c => HCell(c, "S.Num"));
                    table.Cell().Element(c => HCell(c, "Item Description"));
                    table.Cell().Element(c => HCell(c, "QTY"));
                    table.Cell().Element(c => HCell(c, "UNIT"));
                    table.Cell().Element(c => HCell(c, "Rate"));
                    table.Cell().Element(c => HCell(c, "Amount"));

                    foreach (var item in invoice.Items)
                    {
                        void DCell(IContainer c, string text, bool alignRight = false)
                        {
                            var cell = c.BorderVertical(1).BorderBottom(1).BorderColor(Colors.Black).PaddingHorizontal(4).PaddingVertical(3);
                            if (alignRight) cell.AlignRight().Text(text);
                            else cell.Text(text);
                        }

                        table.Cell().Element(c => { DCell(c, item.SNo.ToString()); });
                        table.Cell().Element(c => { DCell(c, item.Description); });
                        table.Cell().Element(c => { DCell(c, item.Quantity.ToString("0.##")); });
                        table.Cell().Element(c => { DCell(c, item.Unit); });
                        table.Cell().Element(c => { DCell(c, item.Rate.ToString("N2"), true); });
                        table.Cell().Element(c => { DCell(c, item.Amount.ToString("N2"), true); });
                    }

                    // Footer Totals
                    void FCell(IContainer c, string text, bool isValue = false, bool isGrand = false)
                    {
                        var cell = c.Border(1).BorderColor(Colors.Black).Background(isGrand ? "#bfbfbf" : "#d9d9d9").PaddingHorizontal(4).PaddingVertical(3);
                        if (isValue) cell.AlignRight().Text(text).Bold();
                        else cell.AlignCenter().Text(text).Bold();
                    }

                    table.Cell().ColumnSpan(4).Element(c => FCell(c, "Sub Total"));
                    table.Cell().ColumnSpan(2).Element(c => FCell(c, invoice.SubTotal.ToString("N2"), true));

                    table.Cell().ColumnSpan(4).Element(c => FCell(c, $"Add GST {invoice.GstPercentage:0.##}%"));
                    table.Cell().ColumnSpan(2).Element(c => FCell(c, invoice.GstAmount.ToString("N2"), true));

                    table.Cell().ColumnSpan(4).Element(c => FCell(c, "Grand Total", false, true));
                    table.Cell().ColumnSpan(2).Element(c => FCell(c, invoice.GrandTotal.ToString("N2"), true, true));
                });

                // Amount in Words
                col.Item().Border(1).BorderTop(0).BorderColor(Colors.Black).Padding(4)
                    .Text(t => 
                    {
                        t.Span("AMOUNT IN WORDS: ").Bold();
                        t.Span(invoice.AmountInWords + "/=").Bold();
                    });

                // Bank details & Signature
                col.Item().PaddingTop(20).Row(row =>
                {
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().Text("Account Details:").Bold().FontSize(8);
                        c.Item().Text(t => { t.Span("IBAN: ").Bold().FontSize(8); t.Span("PK51 UNIL 0109-000290402836").Bold().FontSize(8).Underline(); });
                        c.Item().Text("MY TECH ENGINEERING COMPANY").Bold().FontSize(8);
                        c.Item().Text("United Bank Limited (UBL)").Bold().FontSize(8);
                        
                        c.Item().PaddingTop(25).Text("Issued By:").Bold().FontSize(8);
                        c.Item().Text("Ahmed Faisal,").Bold().FontSize(8);
                        c.Item().Text("MY TECH ENGINEERING COMPANY PVT LTD.").Bold().FontSize(8);
                        c.Item().Text("ahmed.faisal@mytecheng.com").Bold().FontSize(8).Underline();
                    });
                    
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().Text("Account Details:").Bold().FontSize(8);
                        c.Item().Text(t => { t.Span("IBAN: ").Bold().FontSize(8); t.Span("PK45MEZN0001190102659738").Bold().FontSize(8); });
                        c.Item().Text("MY TECH ENGINEERING COMPANY PVT LTD.").Bold().FontSize(8);
                        c.Item().Text("MEEZAN BANK LIMITED").Bold().FontSize(8);
                    });
                });
            });
        }
    }
}
