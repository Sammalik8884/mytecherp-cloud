using System;
using OfficeOpenXml;
using System.IO;

ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
try {
    using var package = new ExcelPackage(new FileInfo(@"g:\mytecherp\MytechERP\Fike.xlsx"), "Fire2024");
    var ws = package.Workbook.Worksheets[0];
    Console.WriteLine("HEADERS:");
    for(int c=1; c<=ws.Dimension.End.Column; c++) {
        Console.Write(ws.Cells[1,c].Text + " | ");
    }
    Console.WriteLine("\nROW 2:");
    for(int r=2; r<=4; r++) {
        for(int c=1; c<=ws.Dimension.End.Column; c++) {
            Console.Write(ws.Cells[r,c].Text + " | ");
        }
        Console.WriteLine("\n---");
    }
} catch (Exception ex) { Console.WriteLine(ex); }
