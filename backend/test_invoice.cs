using System;
using System.Linq;
class Program {
    static void Main() {
        var asm = System.Reflection.Assembly.LoadFrom(@"C:\Users\USAMA\.nuget\packages\stripe.net\50.3.0\lib\net8.0\Stripe.net.dll");
        var invoiceType = asm.GetType("Stripe.Invoice");
        if (invoiceType != null) {
            foreach (var prop in invoiceType.GetProperties()) {
                if (prop.Name.Contains("Subscript")) {
                    Console.WriteLine(prop.Name + " : " + prop.PropertyType.Name);
                }
            }
        }
    }
}
