using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using MytechERP.Application.DTOs.CRM;
using MytechERP.Application.Interfaces;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace MytechERP.Infrastructure.Services
{
    public class DailyProgressReportPdfService : IDailyProgressReportPdfService
    {
        public DailyProgressReportPdfService()
        {
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public async Task<byte[]> GeneratePdfAsync(DailyProgressReportDto report)
        {
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(11).FontFamily("Arial"));

                    page.Header().Element(compose => ComposeHeader(compose, report));
                    page.Content().Element(compose => ComposeContent(compose, report));
                    page.Footer().Element(compose => ComposeFooter(compose, report));
                });
            });

            using var stream = new MemoryStream();
            document.GeneratePdf(stream);
            return stream.ToArray();
        }

        private void ComposeHeader(IContainer container, DailyProgressReportDto report)
        {
            container.Row(row =>
            {
                row.RelativeItem().Column(column =>
                {
                    column.Item().Text("DAILY SITE PROGRESS REPORT").FontSize(20).SemiBold().FontColor(Colors.Blue.Darken2);
                    column.Item().Text(text =>
                    {
                        text.Span("Project: ").SemiBold();
                        text.Span(report.SiteName ?? $"Site ID: {report.SiteId}");
                    });
                });

                row.ConstantItem(100).AlignRight().Text($"Date: {report.Date:dd MMM yyyy}").SemiBold();
            });
        }

        private void ComposeContent(IContainer container, DailyProgressReportDto report)
        {
            container.PaddingVertical(1, Unit.Centimetre).Column(column =>
            {
                column.Spacing(20);

                // Summary details
                column.Item().Border(1).BorderColor(Colors.Grey.Lighten1).Padding(10).Row(row =>
                {
                    row.RelativeItem().Column(col =>
                    {
                        col.Item().Text($"Site In-charge: {report.SiteInCharge}");
                        col.Item().Text($"Site Opening Time: {report.SiteOpeningTime}");
                    });
                    row.RelativeItem().Column(col =>
                    {
                        col.Item().Text($"Total Workers: {report.TotalWorkers}");
                        col.Item().Text($"Site Closing Time: {report.SiteClosingTime}");
                    });
                });

                column.Item().Text(text =>
                {
                    text.Span("Next Day Activity Plan: ").SemiBold();
                    text.Span(report.NextDayActivityPlan ?? "N/A");
                });

                // Activities
                if (report.Activities != null && report.Activities.Any())
                {
                    column.Item().Text("Activities Done").FontSize(14).SemiBold().Underline();
                    column.Item().Column(col =>
                    {
                        for (int i = 0; i < report.Activities.Count; i++)
                        {
                            col.Item().Text($"{i + 1}. {report.Activities[i].ActivityDone}");
                        }
                    });
                }

                // Materials
                if (report.Materials != null && report.Materials.Any())
                {
                    column.Item().Text("Materials / Items").FontSize(14).SemiBold().Underline();
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
                            header.Cell().BorderBottom(1).PaddingBottom(5).Text("#").SemiBold();
                            header.Cell().BorderBottom(1).PaddingBottom(5).Text("Item").SemiBold();
                            header.Cell().BorderBottom(1).PaddingBottom(5).Text("Quantity").SemiBold();
                            header.Cell().BorderBottom(1).PaddingBottom(5).Text("Remarks").SemiBold();
                        });

                        for (int i = 0; i < report.Materials.Count; i++)
                        {
                            var mat = report.Materials[i];
                            table.Cell().PaddingTop(5).Text((i + 1).ToString());
                            table.Cell().PaddingTop(5).Text(mat.Item);
                            table.Cell().PaddingTop(5).Text(mat.Quantity);
                            table.Cell().PaddingTop(5).Text(mat.Remarks);
                        }
                    });
                }

                // Employees
                if (report.Employees != null && report.Employees.Any())
                {
                    column.Item().Text("Employee Attendance").FontSize(14).SemiBold().Underline();
                    column.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.ConstantColumn(30);
                            columns.RelativeColumn(3);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(1);
                        });

                        table.Header(header =>
                        {
                            header.Cell().BorderBottom(1).PaddingBottom(5).Text("#").SemiBold();
                            header.Cell().BorderBottom(1).PaddingBottom(5).Text("Employee Name").SemiBold();
                            header.Cell().BorderBottom(1).PaddingBottom(5).Text("In Time").SemiBold();
                            header.Cell().BorderBottom(1).PaddingBottom(5).Text("Out Time").SemiBold();
                            header.Cell().BorderBottom(1).PaddingBottom(5).Text("Over Time").SemiBold();
                        });

                        for (int i = 0; i < report.Employees.Count; i++)
                        {
                            var emp = report.Employees[i];
                            table.Cell().PaddingTop(5).Text((i + 1).ToString());
                            table.Cell().PaddingTop(5).Text(emp.EmployeeName);
                            table.Cell().PaddingTop(5).Text(emp.InTime);
                            table.Cell().PaddingTop(5).Text(emp.OutTime);
                            table.Cell().PaddingTop(5).Text(emp.OverTime);
                        }
                    });
                }
            });
        }

        private void ComposeFooter(IContainer container, DailyProgressReportDto report)
        {
            container.Row(row =>
            {
                row.RelativeItem().Text($"Prepared by: {report.CreatedByUserName}");
                row.RelativeItem().AlignRight().Text(x =>
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
