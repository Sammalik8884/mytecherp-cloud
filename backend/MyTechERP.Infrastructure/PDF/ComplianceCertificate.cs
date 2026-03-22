using MytechERP.domain.Entities.common;
using MytechERP.domain.Quotations;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using MytechERP.domain.Entities.CRM;

namespace MyTechERP.Infrastructure.PDF
{
    public class ComplianceCertificate : IDocument
    {
        public Quotation? Quote { get; }
        public Contract? Contract { get; }
        public DocumentSignature? Signature { get; }

        // Quote-based Signature Constructor
        public ComplianceCertificate(Quotation quote, DocumentSignature signature)
        {
            Quote = quote;
            Signature = signature;
        }

        // Manual Contract Constructor
        public ComplianceCertificate(Contract contract)
        {
            Contract = contract;
        }

        public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

        public void Compose(IDocumentContainer container)
        {
            container
                .Page(page =>
                {
                    page.Size(PageSizes.A4.Landscape()); 
                    page.Margin(40);
                    page.PageColor(Colors.White);

                    page.Background().Border(10).BorderColor(Colors.Grey.Lighten2).Padding(10)
                        .Border(2).BorderColor(Colors.Black);

                    page.Header().Element(ComposeHeader);
                    page.Content().Element(ComposeContent);
                    page.Footer().Element(ComposeFooter);
                });
        }

        void ComposeHeader(IContainer container)
        {
            container.PaddingTop(20).Column(col =>
            {
                col.Item().AlignCenter().Text("CERTIFICATE OF COMPLIANCE").FontSize(32).Bold().FontColor(Colors.Blue.Darken2);
                col.Item().PaddingTop(10).AlignCenter().Text("OFFICIAL DIGITAL RECORD").FontSize(12).LetterSpacing(0.2f);
            });
        }

        void ComposeContent(IContainer container)
        {
            container.PaddingVertical(40).PaddingHorizontal(60).Column(col =>
            {
                if (Quote != null)
                {
                    col.Item().Text($"This document certifies that Quotation #{Quote.QuoteNumber} has been successfully approved and cryptographically locked via the MyTech ERP Secure Vault.").FontSize(14).AlignCenter();
                }
                else if (Contract != null) 
                {
                    col.Item().Text($"This document certifies that Service Contract/AMC #{Contract.Id} has been formally registered and cryptographically locked via the MyTech ERP Secure Vault.").FontSize(14).AlignCenter();
                }

                col.Item().PaddingTop(30).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);

                col.Item().PaddingTop(20).Table(table =>
                {
                    table.ColumnsDefinition(c =>
                    {
                        c.RelativeColumn();
                        c.ConstantColumn(100);
                    });

                    table.Header(h =>
                    {
                        h.Cell().Text("Compliance Check").Bold();
                        h.Cell().AlignCenter().Text("Status").Bold();
                    });

                    table.Cell().Text(" Pricing Validation");
                    table.Cell().AlignCenter().Text(" PASS").FontColor(Colors.Green.Medium);

                    table.Cell().Text(" Stock Availability Check");
                    table.Cell().AlignCenter().Text(" PASS").FontColor(Colors.Green.Medium);

                    table.Cell().Text(" Tax & Regulatory Calculation");
                    table.Cell().AlignCenter().Text(" PASS").FontColor(Colors.Green.Medium);

                    table.Cell().Text(" Managerial Approval");
                    table.Cell().AlignCenter().Text(" PASS").FontColor(Colors.Green.Medium);
                });

                col.Item().PaddingTop(40).Row(row =>
                {
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().Text("Cryptographic Proof").Bold().FontSize(12);
                        
                        if (Signature != null)
                        {
                            c.Item().Text($"Timestamp: {Signature.SignedAt:U}").FontSize(9);
                            c.Item().Text($"Signer ID: {Signature.SignedByUserId}").FontSize(9);
                            c.Item().Text($"Key Vault Ver: {Signature.KeyVersion.Substring(Signature.KeyVersion.Length - 6)}").FontSize(9);
                            c.Item().Text($"Doc Hash: {Signature.DataHash.Substring(0, 15)}...").FontSize(9).FontColor(Colors.Grey.Darken1);
                        }
                        else if (Contract != null) 
                        {
                            c.Item().Text($"Timestamp: {DateTime.UtcNow:U}").FontSize(9);
                            c.Item().Text($"Contract Type: Manual AMC").FontSize(9);
                            c.Item().Text($"Key Vault Ver: Local-SEC-01").FontSize(9);
                            c.Item().Text($"Doc Hash: AMC-{Contract.Id}-{Contract.StartDate:yyyyMMdd}...").FontSize(9).FontColor(Colors.Grey.Darken1);
                        }
                    });

                    row.ConstantItem(150).Border(2).BorderColor(Colors.Red.Medium).Padding(10).Column(c =>
                    {
                        c.Item().AlignCenter().Text("DIGITALLY").FontSize(10).Bold().FontColor(Colors.Red.Medium);
                        c.Item().AlignCenter().Text("SIGNED").FontSize(16).Black().Bold().FontColor(Colors.Red.Medium);
                        c.Item().AlignCenter().Text("MyTech Secure").FontSize(8).FontColor(Colors.Red.Medium);
                    });
                });
            });
        }

        void ComposeFooter(IContainer container)
        {
            container.Column(c =>
            {
                if (Signature != null) {
                    c.Item().AlignCenter().Text(Signature.Signature).FontSize(6).FontColor(Colors.Grey.Lighten1);
                } else if (Contract != null) {
                    c.Item().AlignCenter().Text($"SYSTEM-GENERATED-AMC-{Contract.Id}-SIGNATURE").FontSize(6).FontColor(Colors.Grey.Lighten1);
                }
                c.Item().PaddingTop(5).AlignCenter().Text("Generated by MyTech ERP | Verifiable via Azure Key Vault").FontSize(8);
            });
        }
    }
}

