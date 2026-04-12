using MytechERP.Application.DTOs.Quotations;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Reflection;
using System.IO;

namespace MyTechERP.Infrastructure.Services
{
    public class QuotationPdfService
    {
        private static readonly Color BrandColor = Color.FromHex("#006CA9"); 
        private static readonly Color BrandColorLight = Color.FromHex("#E6F2F8");
        private static readonly Color GreyText = Colors.Grey.Darken2;
        private static readonly Color LightBorder = Colors.Grey.Lighten2;

        public byte[] GeneratePdf(QuotationDto quote)
        {
            QuestPDF.Settings.License = LicenseType.Community;

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(30);
                    page.DefaultTextStyle(x => x.FontFamily(Fonts.Arial).FontSize(9).FontColor(Colors.Black));

                    page.Header().Element(container => ComposeHeader(container, quote));

                    page.Content().Element(container => ComposeContent(container, quote));

                    page.Footer().Element(ComposeFooter);
                });
            });

            return document.GeneratePdf();
        }

        void ComposeHeader(IContainer container, QuotationDto quote)
        {
            var headerPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "image2.png");
            
            container.Column(col =>
            {
                // Full width header image
                if (File.Exists(headerPath))
                {
                    col.Item().Image(headerPath).FitWidth();
                }
                else
                {
                    col.Item().Text("MY TECH ENGINEERING COMPANY PVT LTD").FontSize(22).Bold().FontColor(BrandColor);
                }

                // Quote Info Below Header
                col.Item().PaddingTop(10).Row(row =>
                {
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().Text(text => { text.Span("To: ").SemiBold(); text.Span(quote.CustomerName); });
                        if (!string.IsNullOrWhiteSpace(quote.SiteName))
                        {
                            c.Item().Text(text => { text.Span("Site: ").SemiBold(); text.Span(quote.SiteName); });
                        }
                    });

                    row.RelativeItem().AlignRight().Column(c =>
                    {
                        c.Item().Text("Quotation").FontSize(16).Bold().FontColor(Colors.Black);
                        c.Item().Text(text => { text.Span("Quotation #: ").SemiBold(); text.Span(quote.QuoteNumber); });
                        c.Item().Text(text => { text.Span("Date: ").SemiBold(); text.Span(DateTime.Now.ToString("dd/MM/yyyy")); });
                    });
                });
            });
        }

        void ComposeContent(IContainer container, QuotationDto quote)
        {
            container.PaddingTop(20).Column(col =>
            {
                col.Item().Element(c => ComposeTables(c, quote));

                col.Item().Row(row =>
                {
                    row.RelativeItem(); 
                    row.ConstantItem(250).Element(c => ComposeSummary(c, quote));
                });

                col.Item().PaddingTop(20).Element(c => ComposeTerms(c, quote));
            });
        }

        void ComposeTables(IContainer container, QuotationDto quote)
        {
            container.Column(col =>
            {
                bool showImported = quote.SupplyColumnMode == "Both" || quote.SupplyColumnMode == "ImportedOnly";
                bool showLocal = quote.SupplyColumnMode == "Both" || quote.SupplyColumnMode == "LocalOnly";

                var importedItems = quote.Items.Where(i => i.ItemType == "Imported" || i.ItemType == "Service").ToList();
                var localItems = quote.Items.Where(i => i.ItemType == "Local" || i.ItemType == "Service").ToList();

                if (showImported && importedItems.Any())
                {
                    col.Item().PaddingBottom(10).Element(c => DrawTableSection(c, "Supply Imported Items & Services", importedItems, quote.Currency));
                }

                if (showLocal && localItems.Any())
                {
                    col.Item().PaddingBottom(10).Element(c => DrawTableSection(c, "Supply Local Items & Services", localItems, quote.Currency));
                }
            });
        }

        void DrawTableSection(IContainer container, string title, List<QuotationItemDto> items, string currency)
        {
            container.Column(col =>
            {
                col.Item().Background(BrandColor).Padding(5).AlignCenter().Text(title)
                    .Bold().FontColor(Colors.White).FontSize(11);

                col.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(30);  // Sr
                        columns.RelativeColumn();    // Description
                        columns.ConstantColumn(40);  // Qty
                        columns.ConstantColumn(75);  // Rate
                        columns.ConstantColumn(85);  // Amount
                    });

                    table.Header(header =>
                    {
                        header.Cell().Element(HeaderCellStyle).Text("Sr.#");
                        header.Cell().Element(HeaderCellStyle).Text("Description");
                        header.Cell().Element(HeaderCellStyle).AlignCenter().Text("Qty");
                        header.Cell().Element(HeaderCellStyle).AlignRight().Text($"Rate");
                        header.Cell().Element(HeaderCellStyle).AlignRight().Text($"Amount");
                    });

                    int i = 1;
                    foreach (var item in items)
                    {
                        table.Cell().Element(CellStyle).Text(i++.ToString());
                        table.Cell().Element(CellStyle).Text(item.Description);
                        table.Cell().Element(CellStyle).AlignCenter().Text(item.Quantity.ToString());
                        table.Cell().Element(CellStyle).AlignRight().Text(item.UnitPrice.ToString("N2"));
                        table.Cell().Element(CellStyle).AlignRight().Text(item.LineTotal.ToString("N2"));
                    }
                });
            });
        }

        void ComposeSummary(IContainer container, QuotationDto quote)
        {
            container.PaddingTop(10).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn();
                    columns.ConstantColumn(90); 
                });

                // Header
                table.Header(header =>
                {
                    header.Cell().Element(SummaryHeaderStyle).Text("Description");
                    header.Cell().Element(SummaryHeaderStyle).AlignRight().Text("Amount");
                });

                // Rows
                table.Cell().Element(SummaryCellStyle).Text("SUB Total Before Taxes");
                table.Cell().Element(SummaryCellStyle).AlignRight().Text(quote.SubTotal.ToString("N2"));

                table.Cell().Element(SummaryCellStyle).Text($"GST @ {quote.GSTPercentage}%");
                table.Cell().Element(SummaryCellStyle).AlignRight().Text(quote.GSTAmount.ToString("N2"));

                table.Cell().Element(SummaryCellStyle).Text($"Income Tax @ {quote.IncomeTaxPercentage}%");
                table.Cell().Element(SummaryCellStyle).AlignRight().Text(quote.IncomeTaxAmount.ToString("N2"));

                 if (quote.Adjustment != 0)
                {
                    table.Cell().Element(SummaryCellStyle).Text("Adjustment");
                    table.Cell().Element(SummaryCellStyle).AlignRight().Text(quote.Adjustment.ToString("N2"));
                }

                // Total
                table.Cell().Element(SummaryCellStyle).Text("Grand Total All Taxes").Bold();
                table.Cell().Element(SummaryCellStyle).AlignRight().Text(quote.GrandTotal.ToString("N2")).Bold();
            });
        }

        void ComposeTerms(IContainer container, QuotationDto quote)
        {
            container.Column(col =>
            {
                col.Item().Text("Terms & Conditions:").Bold().Underline();
                
                // Helper for terms sections to keep code clean
                void AddTerm(string title, params string[] points)
                {
                    col.Item().PaddingTop(5).Text(title).Bold().FontSize(8);
                    foreach (var p in points)
                    {
                        col.Item().PaddingLeft(5).Text($"- {p}").FontSize(8);
                    }
                }

                AddTerm("Payment & Taxes Terms:", 
                    "Price are as per actual basis.",
                    "GST Tax is mentioned separately on Supply Rates",
                    $"Currency : Unit of Currency of this quotations is {quote.Currency}.",
                    "Payment :  100% Advance Payment after Order Confirmation and Advance Payment."
                );

                AddTerm("Delivery terms:",
                    "Stock Available in EX Pakistan.",
                    "Items will be delivered in 8 to 12 working weeks after order confirmation."
                );

                AddTerm("Warranty terms:",
                    "This Warranty covers the defects resulting from defective parts, items, materials or manufacturing if such defects are revealed during the period of 12 months since the date of purchase.",
                    "The Warranty does not cover consumables or parts of limited regular functionality due to their natural wear and tear.",
                    "The Warranty does not cover Damages: Mechanical or electric damages resulting from incorrect installation, configuration, usage, Improper Maintenance or other activities incompatible with the operation manual.",
                    "The Warranty does not cover Damages caused by acts of God, floods, fires, lighting or other natural disasters, wars, unexpected events.",
                    "The Warranty does not cover Damages result as a result of using chemical cleaning materials."
                );

                AddTerm("Validity terms:",
                    "Quotation validity is 20 days.",
                    "Due to currency devaluation, Seller will reserve the right to adjust their prices if the exchange rate varies greater than +1% of the Quotation Value."
                );

                AddTerm("Transportation/Accommodation/Food/Power for work terms:",
                    "Prices Equipments are for Ex-Karachi. Any further transportation from Karachi to Site will be in client's scope.",
                    "Power for the Work at Site will be in client's scope.",
                    "Travelling and Residence of Team from Karachi to Site will be in client's scope.",
                    "Continuous Supply of Storage will be in client's scope."
                );

                AddTerm("PO Terms:",
                    "After placing the Purchase Order, Any item if cancelled by client, 30% of its value shall be charged.",
                    "The Prices in the above Quotation are based on Total Purchase, No Partial Purchase shall be accepted.",
                    "Purchase Orders must contain our Quotation Number for which it is issue."
                );

                AddTerm("General Terms:",
                    "If Quotation finally gets the winning marks, then LOI must be shared with us before Purchase Order.",
                    "This agreement shall be performed by the BUYER and the SUPPLIER with sincerity. Any questions arising in connection with this agreement shall be promptly resolved through good faith discussion.",
                    "This agreement is to be governed by, and interpreted strictly in accordance with the laws of Islamic Republic of Pakistan."
                );

                // Signatures
                col.Item().PaddingTop(20).Row(row =>
                {
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().Text("Prepared By:").FontSize(8).Bold();
                        c.Item().Text("Engr. Ali Azeem").FontSize(9).SemiBold();
                        c.Item().Text("Estimation & Design Engineer").FontSize(8);
                        c.Item().Text("+92-323-7886379").FontSize(8);
                        c.Item().Text("ali.azeem@mytecheng.com").FontSize(8);
                    });

                    row.RelativeItem().Column(c =>
                    {
                        c.Item().Text("Approved By:").FontSize(8).Bold();
                        c.Item().Text("Mr. Munawar Hasan").FontSize(9).SemiBold();
                        c.Item().Text("Director Sales & Projects").FontSize(8);
                        c.Item().Text("+92-300-9233273").FontSize(8);
                        c.Item().Text("munawar.hasan@mytecheng.com").FontSize(8);
                    });
                });
            });
        }

        void ComposeFooter(IContainer container)
        {
            var footerPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "image3.jpeg");
            container.Column(col =>
            {
                if (File.Exists(footerPath))
                {
                    col.Item().Image(footerPath).FitWidth();
                }
                
                col.Item().PaddingTop(5).AlignCenter().Text(x =>
                {
                    x.Span("Page ");
                    x.CurrentPageNumber();
                });
            });
        }

        // ================= STYLES =================

        static IContainer HeaderCellStyle(IContainer container)
        {
            return container
                .Background(BrandColor)
                .Border(1)
                .BorderColor(Colors.White)
                .Padding(5)
                .DefaultTextStyle(x => x.Bold().FontColor(Colors.White).FontSize(9));
        }

        static IContainer CellStyle(IContainer container)
        {
            return container
                .BorderBottom(1)
                .BorderColor(LightBorder)
                .Padding(5)
                .DefaultTextStyle(x => x.FontSize(9));
        }

        static IContainer SummaryHeaderStyle(IContainer container)
        {
            return container
                .Background(Colors.Green.Medium) // The summary table in screenshot has green header? No, looks like a different shade of blue/teal.
                // Screenshot 1: Summary table header is Green/Teal. 
                // Let's use a nice Teal
                .Background(Color.FromHex("#1ABC9C")) 
                .Padding(5)
                .DefaultTextStyle(x => x.Bold().FontColor(Colors.White).FontSize(9));
        }

        static IContainer SummaryCellStyle(IContainer container)
        {
             return container
                .Border(1)
                .BorderColor(Colors.Grey.Lighten2)
                .Padding(5)
                .DefaultTextStyle(x => x.FontSize(9));
        }
    }
    
    // Extensions for standardizing cells
    public static class QuestExtensions 
    {
        public static void LabelCell(this IContainer container, string text) => container.Text(text).FontSize(9).SemiBold().FontColor(Colors.Grey.Darken2);
        public static void ValueCell(this IContainer container, string text) => container.AlignRight().Text(text).FontSize(9);
    }
}