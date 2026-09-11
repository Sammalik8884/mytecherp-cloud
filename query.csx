using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using MyTechERP.Infrastructure.Data;

var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
optionsBuilder.UseSqlServer("Server=tcp:mytecherp-sql-srv-900.database.windows.net,1433;Initial Catalog=MyTechERPDB;Persist Security Info=False;User ID=mytechadmin;Password=ComplexPassword!234;MultipleActiveResultSets=True;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;");
using var context = new ApplicationDbContext(optionsBuilder.Options);

var expenses = context.Expenses.Include(e => e.Items).Where(e => e.Items.Any(i => i.Amount == 4100 || i.Amount == 9500)).ToList();
foreach(var e in expenses) {
    Console.WriteLine($"ExpID: {e.Id}, ArfID: {e.AmountRequestFormId}, IsDebt: {e.IsPaidByDebt}, By: {e.CreatedByEmail}, Status: {e.Status}");
    foreach(var i in e.Items) Console.WriteLine($" - Item: {i.Amount} {i.DescriptionItems}");
}
