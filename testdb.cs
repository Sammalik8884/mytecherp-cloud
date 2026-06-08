using System;
using System.Data.SqlClient;

class Program
{
    static void Main()
    {
        string connStr = ""Server=tcp:mytecherp-sql-srv-900.database.windows.net,1433;Initial Catalog=MyTechERPDB;Persist Security Info=False;User ID=mytechadmin;Password=ComplexPassword!234;MultipleActiveResultSets=True;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"";
        try
        {
            using (var conn = new SqlConnection(connStr))
            {
                conn.Open();
                Console.WriteLine(""Connection successful!"");
                using (var cmd = new SqlCommand(""SELECT COUNT(*) FROM Sites"", conn))
                {
                    var count = cmd.ExecuteScalar();
                    Console.WriteLine(""Total sites: "" + count.ToString());
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.ToString());
        }
    }
}
