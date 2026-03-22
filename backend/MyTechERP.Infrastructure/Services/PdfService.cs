using Microsoft.EntityFrameworkCore;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Entities.HR;
using MytechERP.Infrastructure.Persistance;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MyTechERP.Infrastructure.Services
{
    public class PdfService  : IPdfService
    {
        private readonly ApplicationDbContext _context;

        public PdfService(ApplicationDbContext context)
        {
            _context = context;

            QuestPDF.Settings.License = LicenseType.Community;
        }

        public async Task<byte[]> GeneratePayslipPdfAsync(int payslipId)
        {
            var payslip = await _context.Payslips
                .Include(p => p.Entries)
                .FirstOrDefaultAsync(p => p.Id == payslipId);

            if (payslip == null) throw new Exception("Payslip not found.");

            var profile = await _context.EmployeeProfiles
                .FirstOrDefaultAsync(p => p.UserId == payslip.UserId);

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(11).FontFamily(Fonts.Arial));

                    page.Header().Row(row =>
                    {
                        row.RelativeItem().Column(col =>
                        {
                            col.Item().Text("MyTech ERP").FontSize(24).SemiBold().FontColor(Colors.Blue.Darken2);
                            col.Item().Text("Official Employee Payslip").FontSize(14).FontColor(Colors.Grey.Medium);
                        });
                        row.RelativeItem().AlignRight().Text($"Date: {DateTime.UtcNow:MMM dd, yyyy}");
                    });

                    page.Content().PaddingVertical(1, Unit.Centimetre).Column(column =>
                    {
                        column.Item().Text($"Employee ID: {payslip.UserId}").SemiBold();
                        column.Item().Text($"Pay Period: {payslip.PeriodStart:MMM dd, yyyy} - {payslip.PeriodEnd:MMM dd, yyyy}");
                        if (profile != null)
                        {
                            column.Item().Text($"Bank Account: {profile.BankAccountNumber}");
                        }

                        column.Item().PaddingVertical(10).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);

                        column.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(3); 
                                columns.RelativeColumn(1); 
                            });

                            table.Header(header =>
                            {
                                header.Cell().Text("Description").SemiBold();
                                header.Cell().AlignRight().Text("Amount (USD)").SemiBold();
                            });

                            table.Cell().Text("Monthly Base Salary");
                            table.Cell().AlignRight().Text($"${payslip.BaseSalaryAmount:N2}");

                            foreach (var entry in payslip.Entries)
                            {
                                var typeLabel = entry.Type == PayrollEntryType.Bonus ? "(+)" : "(-)";
                                var color = entry.Type == PayrollEntryType.Bonus ? Colors.Green.Medium : Colors.Red.Medium;

                                table.Cell().Text($"{entry.Description} {typeLabel}");
                                table.Cell().AlignRight().Text($"${entry.Amount:N2}").FontColor(color);
                            }
                        });

                        column.Item().PaddingVertical(10).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);

                        column.Item().AlignRight().Text($"Net Pay: ${payslip.NetPay:N2}")
                            .FontSize(16).SemiBold().FontColor(Colors.Black);
                    });

                    page.Footer().AlignCenter().Text(x =>
                    {
                        x.Span("Page ");
                        x.CurrentPageNumber();
                        x.Span(" of ");
                        x.TotalPages();
                    });
                });
            });

            return document.GeneratePdf();
        }

        public async Task<byte[]> GenerateContractPdfAsync(int contractId)
        {
            var contract = await _context.Contracts
                .Include(c => c.Customer)
                .Include(c => c.ContractItems)
                .FirstOrDefaultAsync(c => c.Id == contractId);

            if (contract == null) throw new Exception("Contract not found.");

            // Output the Universal "Certificate of Compliance" design for Contracts
            var document = new MyTechERP.Infrastructure.PDF.ComplianceCertificate(contract);

            return document.GeneratePdf();
        }

        public async Task<byte[]> GenerateInvoicePdfAsync(int invoiceId)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.Items)
                .FirstOrDefaultAsync(i => i.Id == invoiceId);

            if (invoice == null) throw new Exception("Invoice not found.");

            var document = new MyTechERP.Infrastructure.PDF.InvoiceDocument(invoice);

            return document.GeneratePdf();
        }

        public async Task<byte[]> GeneratePurchaseOrderPdfAsync(int poId)
        {
            var invoice = await _context.PurchaseOrders
                .Include(p => p.Vendor)
                .Include(p => p.TargetWarehouse)
                .Include(p => p.Items)
                    .ThenInclude(i => i.Product)
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(p => p.Id == poId);

            if (invoice == null) throw new Exception("Purchase Order not found.");

            var document = new MyTechERP.Infrastructure.PDF.PurchaseOrderDocument(invoice);

            return document.GeneratePdf();
        }
    }
}

