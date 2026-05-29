using System.IO;
using System.Linq;
using MytechERP.Application.DTOs.CRM;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace MyTechERP.Infrastructure.Services
{
    public interface IItemProcurementPdfService
    {
        byte[] GeneratePdf(ItemProcurementDto dto);
    }

    public class ItemProcurementPdfService : IItemProcurementPdfService
    {
        public byte[] GeneratePdf(ItemProcurementDto dto)
        {
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(10));

                    page.Header().Element(c => ComposeHeader(c, dto));
                    page.Content().Element(c => ComposeContent(c, dto));
                    page.Footer().Element(ComposeFooter);
                });
            });

            using var stream = new MemoryStream();
            document.GeneratePdf(stream);
            return stream.ToArray();
        }

        private void ComposeHeader(IContainer container, ItemProcurementDto dto)
        {
            container.Row(row =>
            {
                row.RelativeItem().Column(column =>
                {
                    column.Item().Text("ITEM PROCUREMENT").FontSize(20).SemiBold().FontColor(Colors.Blue.Darken2);
                    column.Item().Text($"Site: {dto.SiteName}").FontSize(12);
                    column.Item().Text($"Date: {dto.Date:yyyy-MM-dd}").FontSize(10);
                    if (!string.IsNullOrEmpty(dto.Remarks))
                    {
                        column.Item().Text($"Remarks: {dto.Remarks}").FontSize(10);
                    }
                });
            });
        }

        private void ComposeContent(IContainer container, ItemProcurementDto dto)
        {
            container.PaddingVertical(1, Unit.Centimetre).Column(column =>
            {
                column.Item().PaddingBottom(5).Text("Procurement Items").FontSize(14).SemiBold();
                column.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(30);
                        columns.RelativeColumn(3);
                        columns.RelativeColumn(1);
                        columns.RelativeColumn(2);
                    });

                    table.Header(header =>
                    {
                        header.Cell().Element(CellStyle).Text("No.");
                        header.Cell().Element(CellStyle).Text("Item Name");
                        header.Cell().Element(CellStyle).Text("Quantity");
                        header.Cell().Element(CellStyle).Text("Remarks");

                        static IContainer CellStyle(IContainer container)
                        {
                            return container.DefaultTextStyle(x => x.SemiBold()).PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Black);
                        }
                    });

                    int index = 1;
                    foreach (var item in dto.Items)
                    {
                        table.Cell().Element(CellStyle).Text(index.ToString());
                        table.Cell().Element(CellStyle).Text(item.ItemName);
                        table.Cell().Element(CellStyle).Text(item.Quantity.ToString());
                        table.Cell().Element(CellStyle).Text(item.Remarks ?? "");
                        index++;

                        static IContainer CellStyle(IContainer container)
                        {
                            return container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5);
                        }
                    }
                });
            });
        }

        private void ComposeFooter(IContainer container)
        {
            container.AlignCenter().Text(x =>
            {
                x.Span("Page ");
                x.CurrentPageNumber();
                x.Span(" of ");
                x.TotalPages();
            });
        }
    }
}
