using MytechERP.domain.Inventory;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System;
using System.IO;

namespace MyTechERP.Infrastructure.PDF
{
    public class PurchaseOrderDocument : IDocument
    {
        public PurchaseOrder PurchaseOrder { get; }
        private readonly Color BrandColor = Color.FromHex("#006CA9");
        private readonly Color AccentColor = Color.FromHex("#333333");

        public PurchaseOrderDocument(PurchaseOrder purchaseOrder)
        {
            PurchaseOrder = purchaseOrder;
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
                    col.Item().Text("PURCHASE ORDER").FontSize(22).Bold().FontColor(AccentColor);
                    col.Item().Text($"# {PurchaseOrder.PONumber}").FontSize(14).SemiBold().FontColor(Colors.Grey.Darken2);
                    
                    var statusColor = (int)PurchaseOrder.Status == 2 ? Colors.Green.Darken1 : ((int)PurchaseOrder.Status == 1 ? Colors.Blue.Darken1 : Colors.Grey.Darken1);
                    var statusText = (int)PurchaseOrder.Status == 2 ? "RECEIVED" : ((int)PurchaseOrder.Status == 1 ? "SENT" : "DRAFT");
                    col.Item().PaddingTop(5).Text(statusText).FontSize(12).Bold().FontColor(statusColor);
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
                        c.Item().Text("Vendor To:").SemiBold().FontColor(Colors.Grey.Medium);
                        var vendorName = PurchaseOrder.Vendor != null ? PurchaseOrder.Vendor.Name : "Vendor Details";
                        c.Item().Text(vendorName).FontSize(12).Bold();
                        if (PurchaseOrder.Vendor != null)
                        {
                            c.Item().Text(PurchaseOrder.Vendor.ContactPerson);
                            c.Item().Text(PurchaseOrder.Vendor.Email);
                            c.Item().Text(PurchaseOrder.Vendor.Phone);
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
                            
                            table.Cell().Text("Order Date:").SemiBold();
                            table.Cell().AlignRight().Text(PurchaseOrder.OrderDate.ToString("MMM dd, yyyy"));

                            table.Cell().Text("Req. Delivery:").SemiBold();
                            table.Cell().AlignRight().Text(PurchaseOrder.ExpectedDeliveryDate.HasValue ? PurchaseOrder.ExpectedDeliveryDate.Value.ToString("MMM dd, yyyy") : "N/A");
                            
                            if (PurchaseOrder.TargetWarehouse != null)
                            {
                                table.Cell().Text("Ship To:").SemiBold();
                                table.Cell().AlignRight().Text(PurchaseOrder.TargetWarehouse.Name);
                            }
                        });
                    });
                });

                col.Item().PaddingTop(25).Element(ComposeTable);

                col.Item().PaddingTop(25).Row(row =>
                {
                    row.RelativeItem(2).Column(c =>
                    {
                        c.Item().Text("Notes / Terms:").Bold().FontColor(BrandColor);
                        c.Item().Text("Please supply the above items as per the agreed unit costs. Please include the PO Number on your invoice.").FontSize(9);
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

                            table.Cell().BorderTop(1).BorderColor(Colors.Grey.Lighten2).PaddingTop(5).Text("Total PO Value:").Bold().FontSize(12);
                            table.Cell().BorderTop(1).BorderColor(Colors.Grey.Lighten2).AlignRight().PaddingTop(5).Text($"${PurchaseOrder.TotalAmount:N2}").Bold().FontSize(12).FontColor(BrandColor);
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
                    header.Cell().Background(BrandColor).Padding(5).Text("Item / Product").Style(headerStyle);
                    header.Cell().Background(BrandColor).Padding(5).AlignRight().Text("Qty").Style(headerStyle);
                    header.Cell().Background(BrandColor).Padding(5).AlignRight().Text("Unit Cost").Style(headerStyle);
                    header.Cell().Background(BrandColor).Padding(5).AlignRight().Text("Total").Style(headerStyle);
                });

                int index = 1;
                foreach (var item in PurchaseOrder.Items)
                {
                    var bgColor = index % 2 == 0 ? Colors.Grey.Lighten4 : Colors.White;
                    var productName = item.Product != null ? item.Product.Name : $"Item #{item.ProductId}";

                    table.Cell().Background(bgColor).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(5).Text(index.ToString());
                    table.Cell().Background(bgColor).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(5).Text(productName);
                    table.Cell().Background(bgColor).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(5).AlignRight().Text(item.QuantityOrdered.ToString());
                    table.Cell().Background(bgColor).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(5).AlignRight().Text($"${item.UnitCost:N2}");
                    table.Cell().Background(bgColor).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(5).AlignRight().Text($"${item.TotalCost:N2}").SemiBold();
                    
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
