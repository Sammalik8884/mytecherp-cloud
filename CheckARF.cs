using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyTechERP.Infrastructure.Persistance;
using System.Linq;
using System.Threading.Tasks;
using System;

class Program
{
    static async Task Main(string[] args)
    {
        var services = new ServiceCollection();
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer("Server=.;Database=MyTechERP;Trusted_Connection=True;TrustServerCertificate=True;"));
        
        var provider = services.BuildServiceProvider();
        var context = provider.GetRequiredService<ApplicationDbContext>();

        var arfs = await context.AmountRequestForms
            .Where(a => a.PurposeOfAdvance.Contains("Excess"))
            .ToListAsync();
            
        foreach (var arf in arfs)
        {
            Console.WriteLine($"ARF: {arf.ArfNumber} - Purpose: {arf.PurposeOfAdvance}");
        }
    }
}
