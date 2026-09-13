using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using MyTechERP.Infrastructure.Data;

var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
optionsBuilder.UseSqlServer("Server=tcp:mytecherp-sql-srv-900.database.windows.net,1433;Initial Catalog=MyTechERPDB;Persist Security Info=False;User ID=mytechadmin;Password=ComplexPassword!234;MultipleActiveResultSets=True;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;");
using var context = new ApplicationDbContext(optionsBuilder.Options);

var fikeProducts = context.Products.Where(p => p.Brand == "FIKE").Take(5).ToList();
Console.WriteLine("FIKE:");
foreach(var p in fikeProducts) {
    Console.WriteLine($"ID: {p.Id}, Name: {p.Name}, ItemCode: {p.ItemCode}");
}

var lifecoProducts = context.Products.Where(p => p.Brand == "LIFECO").Take(5).ToList();
Console.WriteLine("\nLIFECO:");
foreach(var p in lifecoProducts) {
    Console.WriteLine($"ID: {p.Id}, Name: {p.Name}, ItemCode: {p.ItemCode}");
}
