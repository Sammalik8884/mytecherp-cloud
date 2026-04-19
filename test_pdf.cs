using System;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

class Program
{
    static void Main(string[] args)
    {
        Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Content().Column(col => {
                    col.Item().Text("Hello");
                    col.Item().ExtendVertical().AlignBottom().EnsureSpace().Text("Signature");
                });
            });
        }).GeneratePdf("test.pdf");
        Console.WriteLine("Compiled");
    }
}
