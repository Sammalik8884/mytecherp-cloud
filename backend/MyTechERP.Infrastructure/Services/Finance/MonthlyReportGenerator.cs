using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MytechERP.Application.Interfaces;
using MytechERP.Application.Interfaces.Finance;
using MytechERP.Infrastructure.Persistance;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace MyTechERP.Infrastructure.Services.Finance
{
    public class MonthlyReportGenerator : IMonthlyReportGenerator
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;
        private readonly ILogger<MonthlyReportGenerator> _logger;

        public MonthlyReportGenerator(
            ApplicationDbContext context,
            IEmailService emailService,
            ILogger<MonthlyReportGenerator> logger)
        {
            _context = context;
            _emailService = emailService;
            _logger = logger;
            
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public async Task GenerateAndSendMonthlyReportAsync()
        {
            try
            {
                var today = DateTime.UtcNow;
                var startDate = new DateTime(today.Year, today.Month, 1).AddMonths(-1);
                var endDate = startDate.AddMonths(1).AddSeconds(-1);

                _logger.LogInformation($"Generating Monthly Expenses and ARFs Report for period {startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}");

                var expenses = await _context.Expenses
                    .Include(e => e.Items)
                    .Include(e => e.Site)
                    .Include(e => e.Office)
                    .Where(e => e.CreatedAt >= startDate && e.CreatedAt <= endDate && !e.IsDeleted)
                    .ToListAsync();

                var arfs = await _context.AmountRequestForms
                    .Include(a => a.Site)
                    .Include(a => a.Office)
                    .Include(a => a.Payments)
                    .Where(a => a.CreatedAt >= startDate && a.CreatedAt <= endDate && !a.IsDeleted)
                    .ToListAsync();

                var pdfBytes = GeneratePdf(expenses, arfs, startDate, endDate);

                var subject = $"Monthly Expenses and ARFs Report - {startDate:MMMM yyyy}";
                var body = $"<p>Dear Munawar,</p><p>Please find attached the monthly report for Expenses and ARFs for the period of <strong>{startDate:MMM dd, yyyy}</strong> to <strong>{endDate:MMM dd, yyyy}</strong>.</p><p>Regards,<br/>MyTech ERP System</p>";

                await _emailService.SendEmailWithAttachmentAsync("munawar.hasan@mytecheng.com", subject, body, pdfBytes, $"Monthly_Report_{startDate:MMM_yyyy}.pdf");

                _logger.LogInformation("Monthly report generated and emailed successfully to munawar.hasan@mytecheng.com");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate and send monthly report.");
            }
        }

        private byte[] GeneratePdf(
            List<MytechERP.domain.Entities.Finance.Expense> expenses,
            List<MytechERP.domain.Entities.Finance.AmountRequestForm> arfs,
            DateTime startDate,
            DateTime endDate)
        {
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(1, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.Arial));

                    page.Header().Element(c => ComposeHeader(c, startDate, endDate));
                    page.Content().Element(c => ComposeContent(c, expenses, arfs));
                    page.Footer().Element(ComposeFooter);
                });
            });

            return document.GeneratePdf();
        }

        private void ComposeHeader(IContainer container, DateTime start, DateTime end)
        {
            container.Row(row =>
            {
                row.RelativeItem().Column(column =>
                {
                    column.Item().Text("MyTech Engineering").FontSize(20).SemiBold().FontColor(Colors.Blue.Darken2);
                    column.Item().Text("Monthly Expenses and ARFs Report").FontSize(14);
                    column.Item().Text($"Period: {start:MMM dd, yyyy} - {end:MMM dd, yyyy}").FontSize(10).FontColor(Colors.Grey.Medium);
                });
            });
        }

        private void ComposeContent(IContainer container, List<MytechERP.domain.Entities.Finance.Expense> expenses, List<MytechERP.domain.Entities.Finance.AmountRequestForm> arfs)
        {
            container.PaddingVertical(1, Unit.Centimetre).Column(column =>
            {
                column.Spacing(20);

                column.Item().Text("1. Summary By Employee").FontSize(14).SemiBold().Underline();
                ComposeEmployeeSection(column.Item(), expenses, arfs);

                column.Item().Text("2. Summary By Site").FontSize(14).SemiBold().Underline();
                ComposeSiteSection(column.Item(), expenses, arfs);

                column.Item().Text("3. Summary By Office").FontSize(14).SemiBold().Underline();
                ComposeOfficeSection(column.Item(), expenses, arfs);
            });
        }

        private void ComposeEmployeeSection(IContainer container, List<MytechERP.domain.Entities.Finance.Expense> expenses, List<MytechERP.domain.Entities.Finance.AmountRequestForm> arfs)
        {
            var employeeData = new Dictionary<string, (decimal expenses, decimal arfs)>();

            foreach (var expense in expenses)
            {
                var emp = !string.IsNullOrWhiteSpace(expense.CreatedByEmail) ? expense.CreatedByEmail : "Unknown Employee";
                var amt = expense.Items.Sum(x => x.Amount);
                if (!employeeData.ContainsKey(emp)) employeeData[emp] = (0, 0);
                employeeData[emp] = (employeeData[emp].expenses + amt, employeeData[emp].arfs);
            }

            foreach (var arf in arfs)
            {
                var emp = !string.IsNullOrWhiteSpace(arf.EmployeeEmail) ? arf.EmployeeEmail : 
                          (!string.IsNullOrWhiteSpace(arf.EmployeeName) ? arf.EmployeeName : "Unknown Employee");
                var amt = arf.AdvanceRequested;
                if (!employeeData.ContainsKey(emp)) employeeData[emp] = (0, 0);
                employeeData[emp] = (employeeData[emp].expenses, employeeData[emp].arfs + amt);
            }

            container.Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(3);
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(1);
                });

                table.Header(header =>
                {
                    header.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingBottom(5).Text("Employee").SemiBold();
                    header.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingBottom(5).AlignRight().Text("Total Expenses").SemiBold();
                    header.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingBottom(5).AlignRight().Text("Total ARFs").SemiBold();
                    header.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingBottom(5).AlignRight().Text("Grand Total").SemiBold();
                });

                foreach (var kvp in employeeData.OrderBy(x => x.Key))
                {
                    table.Cell().PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Text(kvp.Key);
                    table.Cell().PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).AlignRight().Text($"{kvp.Value.expenses:N2}");
                    table.Cell().PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).AlignRight().Text($"{kvp.Value.arfs:N2}");
                    table.Cell().PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).AlignRight().Text($"{kvp.Value.expenses + kvp.Value.arfs:N2}").SemiBold();
                }
                
                var totalExp = employeeData.Values.Sum(x => x.expenses);
                var totalArf = employeeData.Values.Sum(x => x.arfs);
                table.Cell().PaddingTop(5).Text("TOTAL").SemiBold();
                table.Cell().PaddingTop(5).AlignRight().Text($"{totalExp:N2}").SemiBold();
                table.Cell().PaddingTop(5).AlignRight().Text($"{totalArf:N2}").SemiBold();
                table.Cell().PaddingTop(5).AlignRight().Text($"{totalExp + totalArf:N2}").SemiBold();
            });
        }

        private void ComposeSiteSection(IContainer container, List<MytechERP.domain.Entities.Finance.Expense> expenses, List<MytechERP.domain.Entities.Finance.AmountRequestForm> arfs)
        {
            var siteData = new Dictionary<string, (decimal expenses, decimal arfs)>();

            foreach (var expense in expenses.Where(e => e.SiteId.HasValue || e.OfficeId == null))
            {
                var site = expense.Site?.Name ?? "General/No Site";
                var amt = expense.Items.Sum(x => x.Amount);
                if (!siteData.ContainsKey(site)) siteData[site] = (0, 0);
                siteData[site] = (siteData[site].expenses + amt, siteData[site].arfs);
            }

            foreach (var arf in arfs.Where(a => a.SiteId.HasValue || (!string.IsNullOrWhiteSpace(a.CustomSiteName)) || a.OfficeId == null))
            {
                var site = arf.Site?.Name ?? (string.IsNullOrWhiteSpace(arf.CustomSiteName) ? "General/No Site" : arf.CustomSiteName);
                var amt = arf.AdvanceRequested;
                if (!siteData.ContainsKey(site)) siteData[site] = (0, 0);
                siteData[site] = (siteData[site].expenses, siteData[site].arfs + amt);
            }

            container.Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(3);
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(1);
                });

                table.Header(header =>
                {
                    header.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingBottom(5).Text("Site").SemiBold();
                    header.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingBottom(5).AlignRight().Text("Total Expenses").SemiBold();
                    header.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingBottom(5).AlignRight().Text("Total ARFs").SemiBold();
                    header.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingBottom(5).AlignRight().Text("Grand Total").SemiBold();
                });

                foreach (var kvp in siteData.OrderBy(x => x.Key))
                {
                    table.Cell().PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Text(kvp.Key);
                    table.Cell().PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).AlignRight().Text($"{kvp.Value.expenses:N2}");
                    table.Cell().PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).AlignRight().Text($"{kvp.Value.arfs:N2}");
                    table.Cell().PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).AlignRight().Text($"{kvp.Value.expenses + kvp.Value.arfs:N2}").SemiBold();
                }
            });
        }

        private void ComposeOfficeSection(IContainer container, List<MytechERP.domain.Entities.Finance.Expense> expenses, List<MytechERP.domain.Entities.Finance.AmountRequestForm> arfs)
        {
            var officeData = new Dictionary<string, (decimal expenses, decimal arfs)>();

            foreach (var expense in expenses.Where(e => e.OfficeId.HasValue))
            {
                var office = expense.Office?.Name ?? "Unknown Office";
                var amt = expense.Items.Sum(x => x.Amount);
                if (!officeData.ContainsKey(office)) officeData[office] = (0, 0);
                officeData[office] = (officeData[office].expenses + amt, officeData[office].arfs);
            }

            foreach (var arf in arfs.Where(a => a.OfficeId.HasValue))
            {
                var office = arf.Office?.Name ?? "Unknown Office";
                var amt = arf.AdvanceRequested;
                if (!officeData.ContainsKey(office)) officeData[office] = (0, 0);
                officeData[office] = (officeData[office].expenses, officeData[office].arfs + amt);
            }

            if (!officeData.Any())
            {
                container.Text("No office-specific records found for this period.").Italic().FontColor(Colors.Grey.Medium);
                return;
            }

            container.Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(3);
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(1);
                });

                table.Header(header =>
                {
                    header.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingBottom(5).Text("Office").SemiBold();
                    header.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingBottom(5).AlignRight().Text("Total Expenses").SemiBold();
                    header.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingBottom(5).AlignRight().Text("Total ARFs").SemiBold();
                    header.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingBottom(5).AlignRight().Text("Grand Total").SemiBold();
                });

                foreach (var kvp in officeData.OrderBy(x => x.Key))
                {
                    table.Cell().PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Text(kvp.Key);
                    table.Cell().PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).AlignRight().Text($"{kvp.Value.expenses:N2}");
                    table.Cell().PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).AlignRight().Text($"{kvp.Value.arfs:N2}");
                    table.Cell().PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Grey.Lighten3).AlignRight().Text($"{kvp.Value.expenses + kvp.Value.arfs:N2}").SemiBold();
                }
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
