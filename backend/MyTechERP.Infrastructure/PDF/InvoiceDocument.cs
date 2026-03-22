using MytechERP.domain.Entities.Finance;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System;
using System.IO;

namespace MyTechERP.Infrastructure.PDF
{
    public class InvoiceDocument : IDocument
    {
        public Invoice Invoice { get; }
        private readonly Color BrandColor = Color.FromHex("#006CA9");
        private readonly Color AccentColor = Color.FromHex("#333333");

        public InvoiceDocument(Invoice invoice)
        {
            Invoice = invoice;
        }

        public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

        public void Compose(IDocumentContainer container)
        {
            container
                .Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(40);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.Arial).FontColor(Colors.Black));

                    page.Header().Element(ComposeHeader);
                    page.Content().Element(ComposeContent);
                    page.Footer().Element(ComposeFooter);
                });
        }

        void ComposeHeader(IContainer container)
        {
            var logoPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "logo.png");

            container.Row(row =>
            {
                row.RelativeItem().Column(col =>
                {
                    if (File.Exists(logoPath))
                    {
                        col.Item().Height(60).Image(logoPath).FitArea();
                    }
                    else
                    {
                        col.Item().Text("MY TECH").FontSize(24).Bold().FontColor(BrandColor);
                        col.Item().Text("ENGINEERING COMPANY PVT LTD").FontSize(14).Bold().FontColor(BrandColor);
                    }
                    col.Item().PaddingTop(2).Text("Fire Protection | HVAC | Fabrication | Services").FontSize(9).Italic().FontColor(Colors.Grey.Medium);
                });

                row.ConstantItem(200).AlignRight().Column(col =>
                {
                    col.Item().Text("I N V O I C E").FontSize(24).Bold().FontColor(AccentColor);
                    col.Item().Text($"# {Invoice.InvoiceNumber}").FontSize(14).SemiBold().FontColor(Colors.Grey.Darken2);
                    
                    var statusColor = Invoice.Status == InvoiceStatus.Paid ? Colors.Green.Darken1 : Colors.Red.Darken1;
                    col.Item().PaddingTop(5).Text(Invoice.Status.ToString().ToUpper()).FontSize(12).Bold().FontColor(statusColor);
                });
            });
        }

        void ComposeContent(IContainer container)
        {
            container.PaddingVertical(1, Unit.Centimetre).Column(col =>
            {
                col.Item().Row(row =>
                {
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().Text("Bill To:").SemiBold().FontColor(Colors.Grey.Medium);
                        var custName = Invoice.Customer != null ? Invoice.Customer.Name : "Standard Customer";
                        c.Item().Text(custName).FontSize(12).Bold();
                        if (Invoice.Customer != null)
                        {
                            c.Item().Text(Invoice.Customer.Email);
                            c.Item().Text(Invoice.Customer.Phone);
                            c.Item().Text(Invoice.Customer.Address);
                        }
                    });

                    row.ConstantItem(200).Column(c =>
                    {
                        c.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn();
                                columns.RelativeColumn();
                            });
                            
                            table.Cell().Text("Issue Date:").SemiBold();
                            table.Cell().AlignRight().Text(Invoice.IssueDate.ToString("MMM dd, yyyy"));

                            table.Cell().Text("Due Date:").SemiBold();
                            table.Cell().AlignRight().Text(Invoice.DueDate.ToString("MMM dd, yyyy"));
                            
                            if (Invoice.QuotationId.HasValue)
                            {
                                table.Cell().Text("Ref Quote:").SemiBold();
                                table.Cell().AlignRight().Text($"QT-{Invoice.QuotationId}");
                            }
                            if (Invoice.WorkOrderId.HasValue)
                            {
                                table.Cell().Text("Ref Job:").SemiBold();
                                table.Cell().AlignRight().Text($"WO-{Invoice.WorkOrderId}");
                            }
                        });
                    });
                });

                col.Item().PaddingTop(25).Element(ComposeTable);

                col.Item().PaddingTop(25).Row(row =>
                {
                    row.RelativeItem(2).Column(c =>
                    {
                        c.Item().Text("Payment Instructions:").Bold().FontColor(BrandColor);
                        c.Item().Text("Please make all cheques payable to MY TECH ENGINEERING COMPANY PVT LTD. Direct bank transfers can be sent to standard account on file. Thank you for your business!").FontSize(9);
                    });

                    row.RelativeItem(1).Column(c =>
                    {
                        c.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn();
                                columns.RelativeColumn();
                            });

                            table.Cell().PaddingBottom(5).Text("Subtotal:").SemiBold();
                            table.Cell().AlignRight().PaddingBottom(5).Text($"${Invoice.SubTotal:N2}");

                            if (Invoice.TaxAmount > 0)
                            {
                                table.Cell().PaddingBottom(5).Text("Tax:").SemiBold();
                                table.Cell().AlignRight().PaddingBottom(5).Text($"${Invoice.TaxAmount:N2}");
                            }

                            table.Cell().BorderTop(1).BorderColor(Colors.Grey.Lighten2).PaddingTop(5).Text("Total:").Bold().FontSize(12);
                            table.Cell().BorderTop(1).BorderColor(Colors.Grey.Lighten2).AlignRight().PaddingTop(5).Text($"${Invoice.TotalAmount:N2}").Bold().FontSize(12).FontColor(BrandColor);
                            
                            if (Invoice.AmountPaid > 0)
                            {
                                table.Cell().PaddingTop(5).Text("Amount Paid:").SemiBold().FontColor(Colors.Green.Darken2);
                                table.Cell().AlignRight().PaddingTop(5).Text($"${Invoice.AmountPaid:N2}").SemiBold().FontColor(Colors.Green.Darken2);
                                
                                table.Cell().PaddingTop(5).Text("Balance Due:").Bold();
                                table.Cell().AlignRight().PaddingTop(5).Text($"${(Invoice.TotalAmount - Invoice.AmountPaid):N2}").Bold();
                            }
                        });
                    });
                });
            });
        }

        void ComposeTable(IContainer container)
        {
            var headerStyle = TextStyle.Default.SemiBold().FontColor(Colors.White);

            container.Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(30);
                    columns.RelativeColumn(4);
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(1);
                });

                table.Header(header =>
                {
                    header.Cell().Background(BrandColor).Padding(5).Text("#").Style(headerStyle);
                    header.Cell().Background(BrandColor).Padding(5).Text("Description / Service").Style(headerStyle);
                    header.Cell().Background(BrandColor).Padding(5).AlignRight().Text("Qty").Style(headerStyle);
                    header.Cell().Background(BrandColor).Padding(5).AlignRight().Text("Unit Price").Style(headerStyle);
                    header.Cell().Background(BrandColor).Padding(5).AlignRight().Text("Total").Style(headerStyle);
                });

                int index = 1;
                foreach (var item in Invoice.Items)
                {
                    var bgColor = index % 2 == 0 ? Colors.Grey.Lighten4 : Colors.White;

                    table.Cell().Background(bgColor).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(5).Text(index.ToString());
                    table.Cell().Background(bgColor).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(5).Text(item.Description);
                    table.Cell().Background(bgColor).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(5).AlignRight().Text(item.Quantity.ToString());
                    table.Cell().Background(bgColor).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(5).AlignRight().Text($"${item.UnitPrice:N2}");
                    table.Cell().Background(bgColor).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(5).AlignRight().Text($"${(item.TotalPrice > 0 ? item.TotalPrice : item.Total):N2}").SemiBold();
                    
                    index++;
                }
            });
        }

        void ComposeFooter(IContainer container)
        {
            container.Column(col =>
            {
                col.Item().LineHorizontal(2).LineColor(BrandColor);
                col.Item().PaddingTop(5).Row(row => 
                {
                    row.RelativeItem().Column(c => {
                        c.Item().Text("Head Office:").Bold().FontSize(8);
                        c.Item().Text("B-278, Basement Floor, Gulistan-e-Jouhar\nBlock 2 Opposite Shaikh Zaid University,\nKarachi, Pakistan, 75200.").FontSize(7);
                    });
                    row.AutoItem().PaddingHorizontal(5).LineVertical(30).LineColor(Colors.Grey.Medium);
                    row.RelativeItem().Column(c => {
                        c.Item().Text("Contact:").Bold().FontSize(8);
                        c.Item().Text("+92-213-4187188").FontSize(7);
                        c.Item().Text("info@mytecheng.com").FontSize(7);
                    });
                    row.AutoItem().PaddingHorizontal(5).LineVertical(30).LineColor(Colors.Grey.Medium);
                    row.RelativeItem().Column(c => {
                        c.Item().Text("Business Identity:").Bold().FontSize(8);
                        c.Item().Text("NTN: 8129759-4").FontSize(7);
                        c.Item().Text("www.mytecheng.com").FontSize(7).FontColor(BrandColor);
                    });
                });
                col.Item().PaddingTop(5).AlignCenter().Text(x =>
                {
                    x.Span("Page ");
                    x.CurrentPageNumber();
                    x.Span(" of ");
                    x.TotalPages();
                });
            });
        }
    }
}
