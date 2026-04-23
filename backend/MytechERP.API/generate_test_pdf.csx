using System;
using System.IO;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using MyTechERP.Infrastructure.Persistance;
using MyTechERP.Infrastructure.PDF;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

// Setup context
var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
optionsBuilder.UseSqlServer("Server=tcp:mytecherp-cloud-server.database.windows.net,1433;Initial Catalog=mytecherp_db;Persist Security Info=False;User ID=mytechadmin;Password=Admin@12345;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;");
var context = new ApplicationDbContext(optionsBuilder.Options);

var invoice = context.Invoices.Include(i => i.Customer).Include(i => i.Items).Include(i => i.Quotation).FirstOrDefault();
if (invoice == null) {
    Console.WriteLine("No invoice found");
    return;
}

QuestPDF.Settings.License = LicenseType.Community;
var doc = new InvoiceDocument(invoice);
var bytes = doc.GeneratePdf();
File.WriteAllBytes("test_invoice.pdf", bytes);
Console.WriteLine("Created test_invoice.pdf successfully!");
