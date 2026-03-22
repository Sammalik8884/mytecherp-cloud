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
            var logoPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "logo.png");
            
            container.Row(row =>
            {
                // LEFT: LOGO & COMPANY NAME
                row.RelativeItem().Column(col =>
                {
                    // Attempt to load logo if it exists, otherwise fallback to text
                    if (File.Exists(logoPath))
                    {
                        col.Item().Height(50).Image(logoPath).FitArea();
                    }
                    else
                    {
                         // Fallback Text Logo
                        col.Item().Text("MY TECH").FontSize(22).Bold().FontColor(BrandColor);
                        col.Item().Text("ENGINEERING COMPANY PVT LTD").FontSize(14).Bold().FontColor(BrandColor);
                    }
                    
                    col.Item().PaddingTop(2).Text("Fire Protection | HVAC | Fabrication | Services").FontSize(9).Italic().FontColor(Colors.Grey.Medium);
                });

                row.ConstantItem(180).PaddingLeft(10).Column(col =>
                {
                    col.Item().Text("Quotation").FontSize(16).Bold().AlignRight().FontColor(Colors.Black);
                    
                    col.Item().PaddingTop(10).Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                        });

                        table.Cell().RowSpan(2).LabelCell("To:");
                        table.Cell().RowSpan(2).ValueCell(quote.CustomerName);

                        table.Cell().LabelCell("Quotation #:");
                        table.Cell().ValueCell(quote.QuoteNumber);

                        table.Cell().LabelCell("Date:");
                        table.Cell().ValueCell(DateTime.Now.ToString("dd/MM/yyyy"));
                    });
                     
                    if (!string.IsNullOrWhiteSpace(quote.SiteName))
                    {
                        col.Item().PaddingTop(5).Text(text =>
                        {
                            text.Span("Site: ").SemiBold();
                            text.Span(quote.SiteName);
                        });
                    }
                });
            });
        }

        void ComposeContent(IContainer container, QuotationDto quote)
        {
             var watermarkPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "watermark.png");

            container.PaddingTop(20).Layers(layers =>
            {
                    // Watermark Image
                    if (File.Exists(watermarkPath))
                    {
                        layers.Layer().AlignCenter().AlignMiddle().Width(300).Image(watermarkPath);
                    }

                // PRIMARY CONTENT LAYER
                layers.PrimaryLayer().Column(col =>
                {
                    // Title Bar
                    col.Item().Background(BrandColor).Padding(5).AlignCenter().Text("Quotation for Fire Detection Equipments (Supply Only)")
                        .Bold().FontColor(Colors.White).FontSize(11);

                    // Table
                    col.Item().PaddingTop(10).Element(c => ComposeTable(c, quote));

                    // Summary Section (Below table)
                    col.Item().Row(row =>
                    {
                        row.RelativeItem(); // Spacer
                        row.ConstantItem(250).Element(c => ComposeSummary(c, quote));
                    });

                    // Terms
                    col.Item().PaddingTop(20).Element(c => ComposeTerms(c, quote));
                });
            });
        }

        void ComposeTable(IContainer container, QuotationDto quote)
        {
            container.Table(table =>
            {
                // Define Columns
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(30);  // Sr
                    columns.RelativeColumn();    // Product Description
                    columns.ConstantColumn(40);  // Qty
                    columns.ConstantColumn(35);  // Unit
                    columns.ConstantColumn(75);  // Rate
                    columns.ConstantColumn(85);  // Amount
                });

                // Header
                table.Header(header =>
                {
                    header.Cell().Element(HeaderCellStyle).Text("Sr.#");
                    header.Cell().Element(HeaderCellStyle).Text("Product Name / Description");
                    header.Cell().Element(HeaderCellStyle).AlignCenter().Text("Qty");
                    header.Cell().Element(HeaderCellStyle).AlignCenter().Text("Unit"); // Assuming Unit is needed? Or just empty
                    header.Cell().Element(HeaderCellStyle).AlignRight().Text($"Rate ({quote.Currency})");
                    header.Cell().Element(HeaderCellStyle).AlignRight().Text($"Amount ({quote.Currency})");
                });

                // Rows
                int i = 1;
                foreach (var item in quote.Items)
                {
                    // Striped rows could be added here if desired
                    table.Cell().Element(CellStyle).Text(i++.ToString());
                    table.Cell().Element(CellStyle).Text(item.Description);
                    table.Cell().Element(CellStyle).AlignCenter().Text(item.Quantity.ToString());
                    table.Cell().Element(CellStyle).AlignCenter().Text("-"); // Placeholder for Unit
                    table.Cell().Element(CellStyle).AlignRight().Text(item.UnitPrice.ToString("N2"));
                    table.Cell().Element(CellStyle).AlignRight().Text(item.LineTotal.ToString("N2"));
                }
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
                    $"Currency : Unit of Currency of this quotation is {quote.Currency}.",
                    "Payment : 100% Advance Payment after Order Confirmation and Advance Payment."
                );

                AddTerm("Delivery Terms:",
                    "Items will be delivered in 9 to 11 working weeks after order confirmation."
                );

                AddTerm("Warranty Terms:",
                    "This Warranty covers the defects resulting from defective parts, items, materials or manufacturing if such defects are revealed during the period of 12 months since the date of purchase.",
                    "The Warranty does not cover consumables or parts of limited regular functionality due to their natural wear and tear.",
                    "The Warranty does not cover Damages: Mechanical or electric damages resulting from incorrect installation, configuration, usage, or other activities incompatible with the operation manual.",
                    "The Warranty does not cover Damages caused by acts of God, floods, fires, lighting or other natural disasters, wars, unexpected events, inappropriate voltage or other external factors."
                );

                AddTerm("Validity Terms:",
                    "Quotation validity is 10 days.",
                    "Due to currency devaluation, Seller will reserve the right to adjust their prices if the exchange rate varies greater than +1% of the Quotation Value."
                );

                AddTerm("Transportation/Accommodation/Food/Power for Work Terms:",
                    "Prices Equipments are for Ex-Karachi. Any further transportation will be charged accordingly.",
                    "Power for the Work at Site will be in client scope.",
                    "Continuous Supply And Storage will be in client scope.",
                    "Transportation, Accommodation & Food for My Tech Team will be client's responsibility."
                );

                AddTerm("PO Terms:",
                    "After placing the Purchase Order, Any item if cancelled by client, 30% of its value shall be charged conditioned with MyTech acceptance on the same.",
                    "The Prices in the above Quotation are based on Total Purchase, No Partial Purchase shall be accepted.",
                    "Purchase Orders must contain our Quotation Number for which it is issue."
                );

                AddTerm("General Terms:",
                    "If Quotation finally gets the winning marks, then LOI must be shared with us before Purchase Order.",
                    "This agreement shall be performed by the BUYER and the SUPPLIER with sincerity. Any questions arising in connection with this agreement shall be performed resolved through good faith discussion between both parties.",
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
            // Blue bottom bar style
            container.Column(col =>
            {
               col.Item().LineHorizontal(2).LineColor(BrandColor);
               
               col.Item().PaddingTop(5).Row(row => 
               {
                   // Head Office
                   row.RelativeItem().Column(c => {
                       c.Item().Text("Head Office:").Bold().FontSize(8);
                       c.Item().Text("B-278, Basement Floor, Gulistan-e-Jouhar\nBlock 2 Opposite Shaikh Zaid University,\nKarachi, Pakistan, 75200.").FontSize(7);
                   });

                   // Vertical Line
                   row.AutoItem().PaddingHorizontal(5).LineVertical(30).LineColor(Colors.Grey.Medium);

                   // Contact
                   row.RelativeItem().Column(c => {
                       c.Item().Text("Contact:").Bold().FontSize(8);
                       c.Item().Text("+92-213-4187188").FontSize(7);
                       c.Item().Text("info@mytecheng.com").FontSize(7);
                   });
                   
                   // Vertical Line
                   row.AutoItem().PaddingHorizontal(5).LineVertical(30).LineColor(Colors.Grey.Medium);

                   // Social Media (Text placeholder as images might be missing)
                   row.RelativeItem().Column(c => {
                       c.Item().Text("Social Media:").Bold().FontSize(8);
                       c.Item().Text("www.mytecheng.com").FontSize(7).FontColor(BrandColor);
                   });
                   
                   // Vertical Line
                   row.AutoItem().PaddingHorizontal(5).LineVertical(30).LineColor(Colors.Grey.Medium);

                   // Membership
                   row.RelativeItem().Column(c => {
                       c.Item().Text("Membership:").Bold().FontSize(8);
                       // Placeholders for membership logos
                       c.Item().Text("[APF] [PEC]").FontSize(7); 
                   });
               });

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