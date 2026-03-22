using System;
using Stripe;

class Program {
    static void Main() {
        foreach (var p in typeof(InvoiceLineItem).GetProperties()) {
            if (p.Name.Contains("Subscript")) Console.WriteLine(p.Name + " : " + p.PropertyType.Name);
        }
    }
}
