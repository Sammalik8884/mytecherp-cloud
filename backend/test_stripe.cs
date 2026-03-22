using System;
using Stripe;
class Program {
    static void Main() {
        var type = typeof(Subscription);
        foreach (var prop in type.GetProperties()) {
            if (prop.Name.Contains(""Period"")) {
                Console.WriteLine(prop.Name);
            }
        }
    }
}
